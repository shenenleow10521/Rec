# REC PAD technical explorer

The presentation explorer describes the uploaded REC PAD 1.0.10 Android application and the companion source at RemoteControl commit `06202cec659052fd6503e1d8ed9ded5f3e0d031e`. It does not connect to or command hardware.

APK SHA-256: `c7e02c19d080e84229fff9ab4ecb06527a9fdb3b6ae58f2e424a7106221ef356`

APK classes2.dex exposes native Java controller, Classic Bluetooth SPP transport, a 120 ms repeat loop, separate claw controls, PWM feedback strings, and the stop frame. Source files checked: MainActivity.java, ButtonMapping.java, ControllerEngine.java, ClassicBluetooth.java, StopCommand.java, and REC_BLE_Robot.ino.

Default source calibration reverses forward/reverse and left-claw open/close; left/right are always swapped by ButtonMapping. Saved phone preferences can differ. The explorer exposes these switches rather than claiming one wire byte always represents one physical direction. Raw terminal commands bypass ButtonMapping.

Repeated controls use a 120 ms ticker. Drive release sends S; claw releases send J or K. Pause sends CR LF S CR LF ! CR LF P CR LF, clears held actions and latches controls until Resume. Speed sends + or - followed by P; the companion sketch uses PWM 80–255 in steps of 20. The native app accepts REC1 status and a legacy Speed/Drive format.

The companion sketch's 600 ms actuator command timeout and UART_BAUD=9600 are firmware properties, not measurements of installed firmware or app-configured Bluetooth baud. The website does not present a simulated TX frame as a hardware acknowledgement.

The modal uses native dialog focus handling and Escape dismissal, tabs with arrow-key navigation, and stops slide navigation while open. Reduced-motion settings disable packet animation.
