<img align="left" src="https://gitlab.gnome.org/GNOME/gnome-weather/-/raw/main/data/icons/org.gnome.Weather.svg">

# GNOME Shell Extension - Weather or Not

[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

> [!WARNING]
> The extension is now being developed on GNOME's [GitLab instance](https://gitlab.gnome.org/somepaulo/weather-or-not).
> This GitHub repo is now an archive for posteriority.
> Please submit new issues and track previous ones in the new repo.

A simple extension for GNOME Shell 45+ (versions 42 to 44 supported in separate [branch](https://github.com/somepaulo/GNOME-Shell-extension-Weather-or-Not/tree/42-44)) that adds an icon showing the current weather conditions and temperature to the panel. The indicator position can be adjusted in preferences (on GNOME 45+ only). Clicking the icon opens GNOME Weather.

> [!IMPORTANT]
> You need GNOME Weather installed for this extension to function properly and an active internet connection to retrieve and display weather information.
> The temperature unit (Celsius or Fahrenheit) is obtained directly from the system's regional preferences.
______

![screenshot](https://github.com/somepaulo/GNOME-Shell-extension-Weather-or-Not/assets/15643750/f936179b-3f69-4c77-b4a1-1b3cc6c3b133)

## Installation
[<img src="https://user-images.githubusercontent.com/15643750/212080370-77899e64-bae8-43f1-b67a-fc946785c4b3.png" height="100">](https://extensions.gnome.org/extension/5660/weather-or-not/)

Alternatively, use the [Extension Manager](https://github.com/mjakeman/extension-manager) app.

#### Manual installation
1. Make sure you have GNOME Weather installed and a default location set in it
2. Download the [weatherornot@somepaulo.github.io.shell-extension.zip](https://github.com/somepaulo/GNOME-Shell-extension-Weather-or-Not/blob/main/weatherornot%40somepaulo.github.io.shell-extension.zip) archive from this repo and unzip it
3. Copy the `weatherornot@somepaulo.github.io` folder to `~/.local/share/gnome-shell/extensions/`
4. Log out and log back in (on Wayland) or use `Alt+F2`,`r`,`Enter` (on X11)
5. Enable the extension in either `Extensions`, `Extension Manager` or [GNOME Shell Extensions](https://extensions.gnome.org/local/)
