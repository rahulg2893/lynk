import ExpoModulesCore
import UIKit

public class FoldRegionsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FoldRegions")

    View(FoldRegionsView.self) {
      Events("onRegionsChange")
    }
  }
}

/// A plain container that reports the reserved regions crossing it: the fold
/// ("division") and the cameras ("occlusion") on iPhone Duo. UIKit re-runs
/// layout when they change, so asking in layoutSubviews keeps JS current.
/// On devices or iOS versions without reserved regions it reports none.
class FoldRegionsView: ExpoView {
  let onRegionsChange = EventDispatcher()
  private var last: [[String: Any]]? = nil

  override func layoutSubviews() {
    super.layoutSubviews()
    let regions = currentRegions()
    if let last, NSArray(array: last).isEqual(to: regions) { return }
    last = regions
    onRegionsChange(["regions": regions])
  }

  private func currentRegions() -> [[String: Any]] {
    guard #available(iOS 27.1, *) else { return [] }
    // The fold is reported even while inactive (device flat), so layouts can line up with the hinge.
    let division = reservedRegions(kind: .division, options: [.includeInactive]).map { ($0, "division") }
    let occlusion = reservedRegions(kind: .occlusion).filter(\.isActive).map { ($0, "occlusion") }
    return (division + occlusion).map { r, name in
        [
          "kind": name,
          "active": r.isActive,
          "x": r.frame.origin.x, "y": r.frame.origin.y,
          "width": r.frame.size.width, "height": r.frame.size.height,
          "margins": ["top": r.margins.top, "left": r.margins.left, "bottom": r.margins.bottom, "right": r.margins.right],
        ] as [String: Any]
    }
  }
}
