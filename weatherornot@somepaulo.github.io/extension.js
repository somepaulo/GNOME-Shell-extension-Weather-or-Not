/*
 * Weather or Not extension for GNOME Shell 42+
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

const { Clutter, GLib, GObject, St } = imports.gi;
const [major, minor] = imports.misc.config.PACKAGE_VERSION.split(".").map((s) =>
  Number(s)
);
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const WeatherOrNot_Indicator = GObject.registerClass(
  {
    GTypeName: "WeatherOrNot",
  },
  class WeatherOrNot extends PanelMenu.Button {
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
        style_class: "system-status-icon"
      });

      this._label = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        style_class: "system-status-label"
      });
      
      let topBox = new St.BoxLayout({
        style_class: 'panel-status-menu-box'
      });
      topBox.add_child(this._icon);
      topBox.add_child(this._label);
      this.add_child(topBox);
      
      this._pushSignal(
        this._weather,
        "changed",
        this._onWeatherInfoUpdate.bind(this)
      );

      this._pushSignal(this, "destroy", this._onDestroy.bind(this));

      if (this._networkIcon) {
        this._pushSignal(
          this._networkIcon,
          "notify::icon-name",
          this._onNetworkIconNotifyEvents.bind(this)
        );
        this._pushSignal(
          this._networkIcon,
          "notify::visible",
          this._onNetworkIconNotifyEvents.bind(this)
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
      this._label.text = weather.info.get_temp_summary().replace("--", ""); // "--" is not a valid temp...
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
        }
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
  }
);

let _spacer = null;
let _indicator = null;

function enable() {
  let statusArea = imports.ui.main.panel.statusArea;
  let dateMenu = statusArea.dateMenu;
  let weather = dateMenu._weatherItem._weatherClient;
  let network =
    major < 43
      ? statusArea.aggregateMenu._network
      : statusArea.quickSettings._network;
  let networkIcon = network ? network._primaryIndicator : null;
  _spacer = new WeatherOrNot_Indicator(weather, networkIcon);
  _spacer.add_style_class_name('weatherornot-spacer');
  _spacer.reactive = false;
  _indicator = new WeatherOrNot_Indicator(weather, networkIcon);
  _indicator.add_style_class_name('weatherornot');
  _indicator.connect("button-press-event", () => GLib.spawn_command_line_async("gapplication launch org.gnome.Weather"));
  Main.panel._addToPanelBox('Spacer', _spacer, 0, Main.panel._centerBox);
  Main.panel._addToPanelBox('WeatherOrNot', _indicator, 999999999, Main.panel._centerBox);
}

function disable() {
  _spacer.destroy();
  _spacer = null;
  _indicator.destroy();
  _indicator = null;
}

