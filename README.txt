LCD Device Simulator
===================

A web-based simulator for an LCD device that demonstrates various device states, flows, and interactions.

Device Features
--------------
- 160x80 pixel LCD display
- Status LED indicator
- Power button (right side of device)
- Battery indicator (top right corner)

Available Flows
-------------

1. Welcome Flow
   Demonstrates the initial device startup sequence:
   - Welcome Screen: Displays welcome message with green LED
   - Menu Screen: Shows main menu options (Settings, Status, Connect)
   - Status Screen: Displays device status (Battery, Signal)

2. Device Connection Flow
   Shows the device pairing and connection process:
   - Standby: Device ready to connect (green LED)
   - Pairing Mode: Active pairing state (blinking yellow LED)
   - Scanning: Searching for companion app (blinking yellow LED)
   - App Found: Companion app detected (blinking green LED)
   - Connecting: Establishing connection (blinking yellow LED)
   - Connected: Successfully connected (solid green LED)
   - Error: Connection failed (blinking red LED)

3. Error States Flow
   Demonstrates various error conditions:
   - Connection Error: Failed connection attempt
   - Low Battery: Critical battery level (15%)
   - App Not Found: No compatible app detected
   - Pairing Failed: Failed pairing attempt
   - System Error: Internal system error (E001)

4. Power Down Flow
   Shows the device shutdown sequence:
   - Power Button Press: Initial state with power button animation
   - Shutdown Complete: Device powered off state

Device Behaviors
--------------

LED States:
- Solid: Device is in a stable state
- Blinking: Device is in a transitional or active state
- Off: Device is powered off

LED Colors:
- Green: Normal operation
- Yellow: Active process
- Red: Error condition
- White: Neutral state

Power Button Interaction:
- Located on the right side of the device
- Press and hold to initiate shutdown
- 2-second countdown when pressed
- Visual animation indicates button location

Battery Indicator:
- Located in top right corner
- Shows current battery level
- Changes to red when below 20%
- Updates across all states

Usage
-----
1. Select a flow from the dropdown menu
2. Use Previous/Next buttons to navigate through states
3. View current state explanation in the side panel
4. Interact with power button in error and shutdown states

Technical Details
---------------
- Built with HTML5 Canvas for display rendering
- Uses CSS for styling and animations
- JavaScript for state management and interactions
- Responsive design for various screen sizes 