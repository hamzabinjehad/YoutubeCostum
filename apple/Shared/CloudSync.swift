import Foundation
import SafariServices

/// Mirrors extension settings through the user's own iCloud account.
/// There is no server behind this, which is exactly why the app needs no
/// subscription for cross-device sync.
enum CloudSync {
    private static let key = "costum.settings"
    private static let store = NSUbiquitousKeyValueStore.default

    static func start() {
        NotificationCenter.default.addObserver(
            forName: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: store,
            queue: .main
        ) { _ in
            NotificationCenter.default.post(name: .costumCloudChanged, object: nil)
        }
        store.synchronize()
    }

    static func push(_ settings: Any) {
        guard JSONSerialization.isValidJSONObject(settings),
              let data = try? JSONSerialization.data(withJSONObject: settings) else { return }
        store.set(data, forKey: key)
        store.synchronize()
    }

    static func pull() -> Any? {
        guard let data = store.data(forKey: key) else { return nil }
        return try? JSONSerialization.jsonObject(with: data)
    }
}

extension Notification.Name {
    static let costumCloudChanged = Notification.Name("costum.cloud.changed")
}

/// Native messaging endpoint. The extension's background page talks to this
/// through `browser.runtime.sendNativeMessage`.
@available(macOS 11.0, iOS 15.0, *)
class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems.first as? NSExtensionItem
        let message = item?.userInfo?[SFExtensionMessageKey] as? [String: Any]
        let type = message?["type"] as? String ?? ""

        var reply: [String: Any] = [:]

        switch type {
        case "sync.push":
            if let settings = message?["settings"] {
                CloudSync.push(settings)
                reply["ok"] = true
            }
        case "sync.pull":
            if let settings = CloudSync.pull() {
                reply["settings"] = settings
            }
        default:
            reply["ok"] = false
        }

        let response = NSExtensionItem()
        response.userInfo = [SFExtensionMessageKey: reply]
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
