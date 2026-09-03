//
//  ViewController.swift — repo-owned, installed by scripts/package.sh
//
//  The generated version wires the "open-preferences" message on macOS only,
//  so on iOS the single button the app offered did nothing at all: the screen
//  told you to go to Settings and then gave you no way to get there. It also
//  disabled scrolling, which clips the setup steps on smaller devices.
//

import WebKit

#if os(iOS)
import UIKit
typealias PlatformViewController = UIViewController
#elseif os(macOS)
import Cocoa
import SafariServices
typealias PlatformViewController = NSViewController
#endif

let extensionBundleIdentifier = "com.costum.youtube.Extension"

class ViewController: PlatformViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self

#if os(iOS)
        // The setup steps are taller than the boilerplate one-liner was.
        self.webView.scrollView.isScrollEnabled = true
        self.webView.scrollView.showsVerticalScrollIndicator = false
#endif

        self.webView.configuration.userContentController.add(self, name: "controller")

        self.webView.loadFileURL(
            Bundle.main.url(forResource: "Main", withExtension: "html")!,
            allowingReadAccessTo: Bundle.main.resourceURL!
        )
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
#if os(iOS)
        webView.evaluateJavaScript("show('ios')")
#elseif os(macOS)
        webView.evaluateJavaScript("show('mac')")

        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            guard let state = state, error == nil else { return }

            DispatchQueue.main.async {
                if #available(macOS 13, *) {
                    webView.evaluateJavaScript("show('mac', \(state.isEnabled), true)")
                } else {
                    webView.evaluateJavaScript("show('mac', \(state.isEnabled), false)")
                }
            }
        }
#endif
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.body as? String == "open-preferences" else { return }

#if os(iOS)
        // The only App Store-safe route: this app's own page in Settings, which
        // is where iOS surfaces the Safari extension switch. Private
        // "App-prefs:" deep links get an app rejected.
        guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
        UIApplication.shared.open(url)
#elseif os(macOS)
        // Swallowing the error here means a click that does nothing and says
        // nothing — which is what Safari returns when the app is not signed
        // with a real identity. Show it instead.
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            DispatchQueue.main.async {
                if let error = error {
                    let message = error.localizedDescription
                        .replacingOccurrences(of: "\"", with: "'")
                    self.webView.evaluateJavaScript("showError(\"\(message)\")")
                    return
                }
                NSApp.terminate(self)
            }
        }
#endif
    }
}
