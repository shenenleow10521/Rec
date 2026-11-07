# Nano firmware safety explorer

This modal explains the command-decoding and fail-safe excerpt supplied by the user in the screenshot on 2026-11-07. It displays Serial.read(), the F/B/L/R/S switch, and the guard `millis() - lastCmd >= FAILSAFE_MS` with stopMotors().

The screenshot comment says no command for 5 seconds causes a motor stop; no value declaration for FAILSAFE_MS was supplied. The presentation therefore labels 5 seconds as the screenshot example, not the verified setting of installed firmware. It also explains that lastCmd must be refreshed on valid commands. This supplied sketch example is distinct from the earlier RemoteControl companion sketch, whose timeout is 600 ms.

The browser demo feeds illustrative commands every 120 ms until the viewer chooses Simulate signal loss. At 5000 ms of silence it highlights the guard and stop call and stops the wheel animation. Buttons inject new example commands, S stops the simulated motors immediately, and Restore command stream resumes the chosen example. No Arduino code runs and no commands reach hardware. The 40 ms render clock resolves the 120 ms repeat interval. Hidden time is excluded from the demonstration; closing cancels the interval and restores focus.

Validation: `npm run check:nano` covers decoded direction pairs, the 4999/5000 ms timeout boundary, valid-command reset, configurable timeout, continuous input, UI highlighting, restoration, hidden/closed timer cleanup and the displayed timeout context.
