# ARP Simulation Issue Analysis

When the **Forbered** button is pressed the scene is rendered for a split second and then disappears because the component crashes while `generateSteps()` is executed. The default branch for building the generic ARP steps assumes that every scenario defines a `target` device. For the `gratuitous-arp` scenario, however, `target` is explicitly set to `null`, so the expressions `allDevices[s.target].name` and `allDevices[s.target].mac` throw a runtime error. React tears down the component when the error propagates, which makes the freshly created 3D layout disappear immediately after it appears.

## Updated code review

The revised component introduces a dedicated `gratuitous-arp` branch inside `generateSteps()` before the generic logic runs. All `allDevices[s.target]` lookups inside that branch now reference the printer via `s.source`, so React no longer crashes when the scenario is prepared. The rest of the generator branches still only execute when their scenarios provide a concrete `target`, so the original failure path is eliminated.

No other regressions were spotted during the read-through: the new scenario-specific branches return early, `startScenario()` still highlights the correct devices, and packets/labels are created exactly as before. With these changes the layout stays visible after pressing **Forbered**.
