/*
 * Weather or Not extension for GNOME Shell 45+
 * Copyright 2023 Paulo Fino (somepaulo), 2022 Cleo Menezes Jr. (CleoMenezesJr), 2020 Jason Gray (JasonLG1979)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * If this extension breaks your desktop you get to keep all of the pieces...
 */

import Clutter from "gi://Clutter";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import St from "gi://St";
import Soup from "gi://Soup";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as Signals from "resource:///org/gnome/shell/misc/signals.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import weatherCodeToSymbolicIconName from "./utils/weatherCodeConverter.js";

let pillBox, statusArea, weather, network, networkIcon;
let _spacer = null;
let _indicator = null;

class CustomWeatherClient extends Signals.EventEmitter {
  constructor() {
    super();

    this._soupSession = new Soup.Session();
    this._temperature = 0;
    this._weatherCode = 0;
    this._latitude = "";
    this._longitude = "";
    this._useFarenheit = false;
    this._isDay = true;

    this._updateCooldownTimer = null;
    this._updateCooldown = 1000;
    this._firstUpdate = true;
  }

  _buildRequestString() {
    const params = {
      latitude: this._latitude,
      longitude: this._longitude,
      current: "temperature_2m,weather_code,is_day",
    };

    if (this._useFarenheit) {
      params.temperature_unit = "fahrenheit";
    }

    return `https://api.open-meteo.com/v1/forecast?${Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join("&")}`;
  }

  _fetchWeather() {
    if (!this._latitude || !this._longitude) {
      return;
    }

    let request = Soup.Message.new("GET", this._buildRequestString());

    this._soupSession.send_and_read_async(
      request,
      GLib.PRIORITY_DEFAULT,
      null,
      (session, result) => {
        try {
          let bytes = session.send_and_read_finish(result);
          let decoder = new TextDecoder("utf-8");
          let text = decoder.decode(bytes.get_data());
          let data = JSON.parse(text);

          this._temperature = Math.round(data.current.temperature_2m);
          this._weatherCode = data.current.weather_code;
          this._isDay = Boolean(data.current.is_day);

          this.emit("changed");
        } catch (e) {
          logError(e);
        }
      },
    );
  }

  update() {
    if (this._firstUpdate) {
      this._firstUpdate = false;
      this._fetchWeather();

      return;
    }

    if (this._updateCooldownTimer) {
      clearTimeout(this._updateCooldownTimer);
    }

    this._updateCooldownTimer = setTimeout(
      () => this._fetchWeather(),
      this._updateCooldown,
    );
  }

  updateSettings(latitude, longitude, useFarenheit) {
    this._latitude = latitude;
    this._longitude = longitude;
    this._useFarenheit = useFarenheit;

    this.update();
  }

  get_temp() {
    return this._temperature.toString();
  }

  get_symbolic_icon_name() {
    return weatherCodeToSymbolicIconName(this._weatherCode, this._isDay);
  }
}

export default class OpenWeatherExtension extends Extension {
  constructor(metadata) {
    super(metadata);

    this._settingsHandlerIds = null;
    this._position = null;
    this._settings = null;
    this._weather = null;
  }

  enable() {
    statusArea = Main.panel.statusArea;

    weather = new CustomWeatherClient();
    this._weather = weather;

    network = Main.panel._network;
    networkIcon = network ? network._primaryIndicator : null;

    if (!_indicator) {
      _indicator = new WeatherIndicator(weather, networkIcon);
      _indicator.add_style_class_name("weatherornot");
      _indicator.connect("button-press-event", () => {});
    }

    if (!_spacer) {
      _spacer = new WeatherIndicator(weather, networkIcon);
      _spacer.add_style_class_name("weatherornot-spacer");
      _spacer.reactive = false;
    }

    this._settings = this.getSettings();

    this._settingsHandlerIds = [
      this._settings.connect(
        "changed::position",
        this._addIndicator.bind(this),
      ),
      this._settings.connect("changed::unit", this._updateSettings.bind(this)),
      this._settings.connect(
        "changed::latitude",
        this._updateSettings.bind(this),
      ),
      this._settings.connect(
        "changed::longitude",
        this._updateSettings.bind(this),
      ),
    ];

    this._updateSettings();
    this._addIndicator();
  }

  _updateSettings() {
    const latitude = this._settings.get_double("latitude");
    const longitude = this._settings.get_double("longitude");
    const useFarenheit = this._settings.get_enum("unit");

    this._weather.updateSettings(latitude, longitude, useFarenheit === 1);
  }

  _addIndicator() {
    const currentIndicator = statusArea["OpenWeather"];
    const currentSpacer = statusArea["Spacer"];

    if (currentIndicator) {
      statusArea["OpenWeather"] = null;
    }

    if (currentSpacer) {
      statusArea["Spacer"].visible = false;
      statusArea["Spacer"] = null;
    }

    this._position = this._settings.get_enum("position");

    switch (this._position) {
      case 0:
        Main.panel._addToPanelBox(
          "OpenWeather",
          _indicator,
          -1,
          Main.panel._leftBox,
        );
        break;
      case 1:
        Main.panel._addToPanelBox(
          "OpenWeather",
          _indicator,
          0,
          Main.panel._centerBox,
        );
        Main.panel._addToPanelBox("Spacer", _spacer, -1, Main.panel._centerBox);
        statusArea["Spacer"].visible = true;
        break;
      case 2:
        Main.panel._addToPanelBox(
          "OpenWeather",
          _indicator,
          0,
          Main.panel._centerBox,
        );
        break;
      case 3:
        Main.panel._addToPanelBox(
          "OpenWeather",
          _indicator,
          -1,
          Main.panel._centerBox,
        );
        break;
      case 4:
        Main.panel._addToPanelBox(
          "OpenWeather",
          _indicator,
          -1,
          Main.panel._centerBox,
        );
        Main.panel._addToPanelBox("Spacer", _spacer, 0, Main.panel._centerBox);
        statusArea["Spacer"].visible = true;
        break;
      case 5:
        Main.panel._addToPanelBox(
          "OpenWeather",
          _indicator,
          1,
          Main.panel._rightBox,
        );
    }
  }

  disable() {
    this._settingsHandlerIds.forEach((settingId) =>
      this._settings.disconnect(settingId),
    );

    this._settingsHandlerIds = null;
    this._settings = null;

    if (_spacer) {
      _spacer.destroy();
      _spacer = null;
    }

    if (_indicator) {
      _indicator.destroy();
      _indicator = null;
    }

    pillBox = null;
    weather = null;
  }
}

const WeatherIndicator = GObject.registerClass(
  {
    GTypeName: "WeatherIndicator",
  },
  class WeatherIndicator extends PanelMenu.Button {
    _init(weather, networkIcon) {
      super._init({
        y_align: Clutter.ActorAlign.CENTER,
        visible: false,
      });

      this._weather = weather;
      this._networkIcon = networkIcon;

      this._signals = [];

      this._icon = new St.Icon({
        y_align: Clutter.ActorAlign.CENTER,
        style_class: "system-status-icon",
      });

      this._label = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        style_class: "system-status-label",
      });

      let pillBox = new St.BoxLayout({
        y_align: Clutter.ActorAlign.CENTER,
        style_class: "panel-status-menu-box",
      });

      pillBox.add_child(this._icon);
      pillBox.add_child(this._label);

      this.add_child(pillBox);

      this._pushSignal(
        this._weather,
        "changed",
        this._onWeatherInfoUpdate.bind(this),
      );

      this._pushSignal(this, "destroy", this._onDestroy.bind(this));

      if (this._networkIcon) {
        this._pushSignal(
          this._networkIcon,
          "notify::icon-name",
          this._onNetworkIconNotifyEvents.bind(this),
        );
        this._pushSignal(
          this._networkIcon,
          "notify::visible",
          this._onNetworkIconNotifyEvents.bind(this),
        );
        if (this._networkIcon.visible) {
          this._weather.update();
          this._StartLongTermUpdateTimeout();
        }
      } else {
        this._weather.update();
        this._StartLongTermUpdateTimeout();
      }
    }

    _pushSignal(obj, signalName, callback) {
      this._signals.push({
        obj: obj,
        signalId: obj.connect(signalName, callback),
      });
    }

    _onWeatherInfoUpdate(weather) {
      this._icon.icon_name = weather.get_symbolic_icon_name();
      this._label.text = weather.get_temp();

      this.visible = this._icon.icon_name && this._label.text;
    }

    _onNetworkIconNotifyEvents(networkIcon) {
      if (networkIcon.visible && !this.visible) {
        this._weather.update();
        this._StartLongTermUpdateTimeout();
      } else if (!networkIcon.visible) {
        this._cancelLongTermUpdateTimeout();
        this.visible = false;
      }
    }

    _StartLongTermUpdateTimeout() {
      this._cancelLongTermUpdateTimeout();

      this._weatherUpdateTimeout = GLib.timeout_add_seconds(
        GLib.PRIORITY_LOW,
        600,
        () => {
          this._weather.update();
          return GLib.SOURCE_CONTINUE;
        },
      );
    }

    _cancelLongTermUpdateTimeout() {
      if (this._weatherUpdateTimeout) {
        GLib.source_remove(this._weatherUpdateTimeout);
      }

      this._weatherUpdateTimeout = null;
    }

    _onDestroy() {
      this._cancelLongTermUpdateTimeout();
      this._signals.forEach((signal) => signal.obj.disconnect(signal.signalId));
      this._signals = null;
      this._weather = null;
      this._networkIcon = null;
    }
  },
);
