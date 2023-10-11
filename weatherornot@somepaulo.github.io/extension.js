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
import * as Weather from "resource:///org/gnome/shell/misc/weather.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

let _spacer = null;
let _indicator = null;
let weatherPill = null;
let topBox, statusArea, dateMenu, weather, network, networkIcon;

export default class weatherOrNot {
  enable() {
    if (!weatherPill) {
      statusArea = Main.panel.statusArea;
      dateMenu = statusArea.dateMenu;
      weather = new Weather.WeatherClient();
      network = Main.panel._network;
      networkIcon = network ? network._primaryIndicator : null;
      
      _spacer = new WeatherPill(weather, networkIcon);
      _spacer.add_style_class_name('weatherornot-spacer');
      _spacer.reactive = false;
      _indicator = new WeatherPill(weather, networkIcon);
      _indicator.add_style_class_name('weatherornot');
      _indicator.connect("button-press-event", () => GLib.spawn_command_line_async("gapplication launch org.gnome.Weather"));
      
      Main.panel._addToPanelBox('Spacer', _spacer, 0, Main.panel._centerBox);
      Main.panel._addToPanelBox('WeatherOrNot', _indicator, 999999999, Main.panel._centerBox);
    }
  }

  disable() {
    topBox = null;
    if (_spacer) {
      _spacer.destroy();
      _spacer = null;
    }
    if (_indicator) {
      _indicator.destroy();
      _indicator = null;
    }
    weather = null;
  }
}

const WeatherPill = GObject.registerClass(
  {
    GTypeName: "WeatherPill",
  },
  class WeatherPill extends PanelMenu.Button {
    _init(weather, networkIcon) {
      super._init({
        y_align: Clutter.ActorAlign.CENTER,
        visible: false,
      });

      this._weather = weather;
      this._networkIcon = networkIcon;

      this._signals = [];

      this._icon = new St.Icon({
        icon_size: 16,
        y_align: Clutter.ActorAlign.CENTER,
      });
      this._icon.add_style_class_name("system-status-icon");

      this._label = new St.Label({
        style_class: "system-status-label",
      });
      this._label.clutter_text.y_align = Clutter.ActorAlign.CENTER;
      this._label.add_style_class_name("weather_label");

      let topBox = new St.BoxLayout({
        style_class: 'panel-status-menu-box'
      });
      topBox.add_child(this._icon);
      topBox.add_child(this._label);
      this.add_child(topBox);

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
      this._icon.icon_name = weather.info.get_symbolic_icon_name();
      // "--" is not a valid temp...
      this._label.text = weather.info.get_temp_summary().replace("--", "");
      this.visible = this._icon.icon_name && this._label.text;
    }

    _onNetworkIconNotifyEvents(networkIcon) {
      if (networkIcon.visible && !this.visible) {
        this._weather.update();
        this._StartLongTermUpdateTimeout();
      } else if (!networkIcon.visible) {
        this._canceLongTermUpdateTimeout();
        this.visible = false;
      }
    }

    _StartLongTermUpdateTimeout() {
      this._canceLongTermUpdateTimeout();
      this._weatherUpdateTimeout = GLib.timeout_add_seconds(
        GLib.PRIORITY_LOW,
        600,
        () => {
          this._weather.update();
          return GLib.SOURCE_CONTINUE;
        },
      );
    }

    _canceLongTermUpdateTimeout() {
      if (this._weatherUpdateTimeout) {
        GLib.source_remove(this._weatherUpdateTimeout);
      }
      this._weatherUpdateTimeout = null;
    }

    _onDestroy() {
      this._canceLongTermUpdateTimeout();
      this._signals.forEach((signal) => signal.obj.disconnect(signal.signalId));
      this._signals = null;
      this._weather = null;
      this._networkIcon = null;
    }
  },
);

