#!/usr/bin/env swift
//
// Draws every icon Costum ships from one description of the mark, so the
// app, the Safari and Chrome toolbars, the extension list and the popup's
// own mark cannot drift apart again. They had: the popup drew a red tile
// with white sliders while every PNG was a dark tile with blue ones.
//
//   swift scripts/icons.swift
//
// Writes extension/images/*.png and apple/App/Icons/**. package.sh copies the
// Apple ones into the generated Xcode project.
//
// The mark is the popup's `.mark`: a red tile, #FF4B4B at the top to #D6202B
// at the bottom, carrying three white sliders on rows at 28%, 50% and 72%,
// their knobs at 71%, 37% and 59% across. Below 24px three rows turn to mush,
// so the toolbar sizes draw two.
//

import AppKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let root = URL(fileURLWithPath: CommandLine.arguments[0])
    .deletingLastPathComponent().deletingLastPathComponent()

// MARK: - Palette

func rgb(_ hex: UInt32, _ alpha: CGFloat = 1) -> CGColor {
    CGColor(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255, alpha: alpha)
}

let redTop = rgb(0xFF4B4B), redBottom = rgb(0xD6202B)
let white = rgb(0xFFFFFF)

enum Variant {
    /// Red tile, white sliders. Everywhere by default.
    case light
    /// iOS dark appearance: the tile goes dark and the knobs carry the red.
    case dark
    /// iOS tinted appearance: grayscale, which the system colours itself.
    case tinted
}

// MARK: - Shapes

/// Apple's icon outline is a continuous-curvature rounded square; a
/// superellipse with n = 5 is the standard close approximation.
func squircle(_ r: CGRect, n: CGFloat = 5) -> CGPath {
    let path = CGMutablePath()
    let a = r.width / 2, b = r.height / 2
    let steps = 720
    for i in 0...steps {
        let t = CGFloat(i) / CGFloat(steps) * 2 * .pi
        let c = cos(t), s = sin(t)
        let point = CGPoint(x: r.midX + a * copysign(pow(abs(c), 2 / n), c),
                            y: r.midY + b * copysign(pow(abs(s), 2 / n), s))
        if i == 0 { path.move(to: point) } else { path.addLine(to: point) }
    }
    path.closeSubpath()
    return path
}

/// Draws the tile's ground and the sliders into `tile`, in a context whose
/// origin is top-left.
func drawMark(_ ctx: CGContext, in tile: CGRect, variant: Variant, rows: Int) {
    let T = tile.width

    // Ground.
    ctx.saveGState()
    let colors: [CGColor]
    switch variant {
    case .light: colors = [redTop, redBottom]
    case .dark: colors = [rgb(0x2C2C2E), rgb(0x121214)]
    case .tinted: colors = [rgb(0x000000), rgb(0x000000)]
    }
    let gradient = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB),
                              colors: colors as CFArray, locations: [0, 1])!
    ctx.drawLinearGradient(gradient, start: CGPoint(x: tile.midX, y: tile.minY),
                           end: CGPoint(x: tile.midX, y: tile.maxY), options: [])
    ctx.restoreGState()

    // Sliders.
    let layout: [(y: CGFloat, knob: CGFloat)] = rows == 2
        ? [(0.35, 0.65), (0.65, 0.36)]
        : [(0.28, 0.71), (0.50, 0.37), (0.72, 0.59)]
    let small = rows == 2
    let track = max(1, T * (small ? 0.085 : 0.058))
    let radius = T * (small ? 0.135 : 0.098)
    let inset = T * (small ? 0.2 : 0.22)

    let trackColor: CGColor
    switch variant {
    case .light: trackColor = rgb(0xFFFFFF, small ? 1 : 0.88)
    case .dark: trackColor = rgb(0xFFFFFF, 0.62)
    case .tinted: trackColor = rgb(0xFFFFFF, 0.55)
    }

    for row in layout {
        let y = tile.minY + T * row.y
        ctx.setStrokeColor(trackColor)
        ctx.setLineWidth(track)
        ctx.setLineCap(.round)
        ctx.move(to: CGPoint(x: tile.minX + inset, y: y))
        ctx.addLine(to: CGPoint(x: tile.maxX - inset, y: y))
        ctx.strokePath()
    }

    for row in layout {
        let center = CGPoint(x: tile.minX + T * row.knob, y: tile.minY + T * row.y)
        let knob = CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2)
        ctx.saveGState()
        // A knob sits on its track, so it casts a little shadow onto it. Not
        // at toolbar sizes, where a shadow is just a blur.
        if !small {
            ctx.setShadow(offset: CGSize(width: 0, height: -T * 0.012), blur: T * 0.03,
                          color: rgb(0x000000, variant == .light ? 0.28 : 0.5))
        }
        switch variant {
        case .light, .tinted:
            ctx.setFillColor(white)
            ctx.fillEllipse(in: knob)
        case .dark:
            ctx.addEllipse(in: knob)
            ctx.clip()
            let red = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB),
                                 colors: [redTop, redBottom] as CFArray, locations: [0, 1])!
            ctx.drawLinearGradient(red, start: CGPoint(x: knob.midX, y: knob.minY),
                                   end: CGPoint(x: knob.midX, y: knob.maxY), options: [])
        }
        ctx.restoreGState()
    }
}

// MARK: - Output

enum Frame {
    /// Rounded tile filling the canvas, transparent corners: extension icons.
    case tile
    /// Full-bleed square, no alpha: iOS masks it itself and App Store
    /// Connect rejects an app icon that has an alpha channel.
    case fullBleed
    /// macOS grid: an 824-point tile centred on a 1024 canvas, with the
    /// system's drop shadow, so it sits among other Dock icons.
    case mac
}

func render(size: Int, frame: Frame, variant: Variant = .light, rows: Int? = nil, to path: String) {
    let S = CGFloat(size)
    let opaque = frame == .fullBleed
    let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
                        space: CGColorSpace(name: CGColorSpace.sRGB)!,
                        bitmapInfo: opaque ? CGImageAlphaInfo.noneSkipLast.rawValue
                                           : CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.interpolationQuality = .high
    ctx.setShouldAntialias(true)
    // Top-left origin, so the mark reads the same as the CSS that draws it.
    ctx.translateBy(x: 0, y: S)
    ctx.scaleBy(x: 1, y: -1)

    let tile: CGRect
    switch frame {
    case .tile, .fullBleed: tile = CGRect(x: 0, y: 0, width: S, height: S)
    case .mac:
        let side = S * 824 / 1024
        tile = CGRect(x: (S - side) / 2, y: (S - side) / 2 - S * 10 / 1024, width: side, height: side)
    }
    let rowCount = rows ?? (tile.width < 24 ? 2 : 3)

    if frame != .fullBleed {
        let outline = squircle(tile)
        if frame == .mac {
            ctx.saveGState()
            ctx.setShadow(offset: CGSize(width: 0, height: -S * 10 / 1024), blur: S * 28 / 1024,
                          color: rgb(0x000000, 0.3))
            ctx.addPath(outline)
            ctx.setFillColor(redBottom)
            ctx.fillPath()
            ctx.restoreGState()
        }
        ctx.addPath(outline)
        ctx.clip()
    }
    drawMark(ctx, in: tile, variant: variant, rows: rowCount)

    let url = root.appendingPathComponent(path)
    try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
    CGImageDestinationFinalize(dest)
}

func write(_ text: String, to path: String) {
    let url = root.appendingPathComponent(path)
    try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    try! text.write(to: url, atomically: true, encoding: .utf8)
}

// Extension: the listing icons, then the toolbar ones. A toolbar icon is 16
// points; its 2x is the same two-row drawing, not a shrunken 3-row one.
for size in [48, 96, 128, 256, 512] {
    render(size: size, frame: .tile, to: "extension/images/icon-\(size).png")
}
for size in [16, 19, 32, 38] {
    render(size: size, frame: .tile, rows: 2, to: "extension/images/toolbar-\(size).png")
}

// Apple: iOS in three appearances, then the Mac sizes.
let appIcon = "apple/App/Icons/AppIcon.appiconset"
render(size: 1024, frame: .fullBleed, to: "\(appIcon)/ios-1024.png")
render(size: 1024, frame: .fullBleed, variant: .dark, to: "\(appIcon)/ios-1024-dark.png")
render(size: 1024, frame: .fullBleed, variant: .tinted, to: "\(appIcon)/ios-1024-tinted.png")

var images: [String] = [
    #"{ "idiom" : "universal", "platform" : "ios", "size" : "1024x1024", "filename" : "ios-1024.png" }"#,
    #"{ "idiom" : "universal", "platform" : "ios", "size" : "1024x1024", "filename" : "ios-1024-dark.png", "appearances" : [ { "appearance" : "luminosity", "value" : "dark" } ] }"#,
    #"{ "idiom" : "universal", "platform" : "ios", "size" : "1024x1024", "filename" : "ios-1024-tinted.png", "appearances" : [ { "appearance" : "luminosity", "value" : "tinted" } ] }"#
]
for points in [16, 32, 128, 256, 512] {
    for scale in [1, 2] {
        let name = "mac-\(points)@\(scale)x.png"
        render(size: points * scale, frame: .mac, rows: points < 24 ? 2 : 3, to: "\(appIcon)/\(name)")
        images.append(#"{ "idiom" : "mac", "size" : "\#(points)x\#(points)", "scale" : "\#(scale)x", "filename" : "\#(name)" }"#)
    }
}
write("{\n  \"images\" : [\n    " + images.joined(separator: ",\n    ")
      + "\n  ],\n  \"info\" : { \"author\" : \"scripts/icons.swift\", \"version\" : 1 }\n}\n",
      to: "\(appIcon)/Contents.json")

// The setup screen's hero. Full-bleed: SwiftUI rounds its corners.
render(size: 512, frame: .fullBleed, to: "apple/App/Icons/LargeIcon.imageset/large-icon.png")
write(#"""
{
  "images" : [ { "idiom" : "universal", "filename" : "large-icon.png" } ],
  "info" : { "author" : "scripts/icons.swift", "version" : 1 }
}

"""#, to: "apple/App/Icons/LargeIcon.imageset/Contents.json")

print("Icons written to extension/images and apple/App/Icons")
