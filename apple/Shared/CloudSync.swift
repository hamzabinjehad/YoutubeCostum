import Foundation
import SafariServices

/// Mirrors extension settings through the user's own iCloud account.
/// There is no server behind this, which is exactly why the app needs no
/// subscription for cross-device sync.
enum CloudSync {
    private static let key = "costum.settings"
    private static let store = NSUbiquitousKeyValueStore.default

    /// The extension handler can be created more than once. Register exactly
    /// one observer so every new request does not create another notification
    /// fan-out for the same iCloud change.
    private static let started: Void = {
        NotificationCenter.default.addObserver(
            forName: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: store,
            queue: .main
        ) { _ in
            NotificationCenter.default.post(name: .costumCloudChanged, object: nil)
        }
        store.synchronize()
    }()

    static func start() {
        _ = started
    }

    /// Whether this device is signed in to iCloud at all. The key-value store
    /// accepts writes without it, silently, and they go nowhere — which is the
    /// failure the extension needs to be able to report instead of "synced".
    static var available: Bool {
        FileManager.default.ubiquityIdentityToken != nil
    }

    /// The store allows 1 MB in total; the payload is a few kilobytes, and a
    /// write that would exceed the cap is dropped by the system without a
    /// word. Refusing it here is what turns that into a message.
    private static let limit = 900_000

    /// Returns nil on success, or a short reason the extension can show.
    /// Every failure that used to be swallowed by a bare `guard … else return`
    /// is a reason now, because the JavaScript side acknowledged each of them
    /// as a successful push.
    static func push(_ payload: Any) -> String? {
        start()
        guard available else { return "not-signed-in" }
        guard JSONSerialization.isValidJSONObject(payload),
              let data = try? JSONSerialization.data(withJSONObject: payload) else { return "invalid-payload" }
        guard data.count <= limit else { return "too-large" }
        store.set(data, forKey: key)
        // synchronize() only reports whether the request to sync was accepted,
        // not that it reached iCloud; that is still more than nothing.
        return store.synchronize() ? nil : "store-refused"
    }

    static func pull() -> Any? {
        start()
        store.synchronize()
        guard let data = store.data(forKey: key) else { return nil }
        return try? JSONSerialization.jsonObject(with: data)
    }
}

extension Notification.Name {
    static let costumCloudChanged = Notification.Name("costum.cloud.changed")
}

/// What the setup screen in the app reads. iOS offers an app no API to ask
/// whether its Safari extension is on, so the extension says so itself: each
/// YouTube page it runs on sends `extension.seen` (at most once a minute), and
/// this writes when, where and which version to the App Group both targets
/// share. Without the App Group entitlement the suite is private to the
/// extension, the app simply never sees a visit, and says "Not seen yet".
enum ExtensionPresence {
    static let group = "group.com.costum.youtube"

    static func record(page: String, mobile: Bool, version: String) {
        guard let defaults = UserDefaults(suiteName: group) else { return }
        defaults.set(Date(), forKey: "costum.lastSeen")
        defaults.set(page, forKey: "costum.lastPage")
        defaults.set(mobile, forKey: "costum.lastMobile")
        defaults.set(version, forKey: "costum.version")
    }
}

/// Native messaging endpoint. The extension's background page talks to this
/// through `browser.runtime.sendNativeMessage`.
@available(macOS 11.0, iOS 15.0, *)
class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    override init() {
        super.init()
        CloudSync.start()
    }

    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems.first as? NSExtensionItem
        let message = item?.userInfo?[SFExtensionMessageKey] as? [String: Any]
        let type = message?["type"] as? String ?? ""

        var reply: [String: Any] = [:]

        switch type {
        case "sync.push":
            // `payload` is { settings, updatedAt, app }; older builds sent the
            // bare settings under `settings`, which still lands, as a payload
            // with no timestamp.
            if let payload = message?["payload"] ?? message?["settings"] {
                if let error = CloudSync.push(payload) {
                    reply["ok"] = false
                    reply["error"] = error
                } else {
                    reply["ok"] = true
                }
            } else {
                reply["ok"] = false
                reply["error"] = "invalid-payload"
            }
        case "sync.pull":
            reply["ok"] = true
            reply["available"] = CloudSync.available
            if let stored = CloudSync.pull() {
                // What was pushed is what comes back: an envelope from this
                // build, or bare settings from an older one. The extension
                // tells them apart by the `settings` key.
                if let envelope = stored as? [String: Any], envelope["settings"] != nil {
                    reply["payload"] = envelope
                } else {
                    reply["settings"] = stored
                }
            }
        case "sync.status":
            reply["ok"] = true
            reply["available"] = CloudSync.available
        case "extension.seen":
            ExtensionPresence.record(page: message?["page"] as? String ?? "",
                                     mobile: message?["mobile"] as? Bool ?? false,
                                     version: message?["version"] as? String ?? "")
            reply["ok"] = true
        default:
            reply["ok"] = false
            reply["error"] = "unknown-message"
        }

        let response = NSExtensionItem()
        response.userInfo = [SFExtensionMessageKey: reply]
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
