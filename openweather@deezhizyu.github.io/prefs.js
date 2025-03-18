import Adw from "gi://Adw";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class WeatherOrNotExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow(prefsWindow) {
    // Create preferences
    const prefsPage = new Adw.PreferencesPage({
      title: _("General"),
      icon_name: "preferences-other-symbolic",
    });
    prefsWindow.add(prefsPage);

    const appearancePrefsGroup = new Adw.PreferencesGroup({
      title: _("Appearance"),
    });
    prefsPage.add(appearancePrefsGroup);

    const locationPrefsGroup = new Adw.PreferencesGroup({
      title: _("Location"),
    });
    prefsPage.add(locationPrefsGroup);

    // Create a list of options for the preferences
    let positionSetting = new Gtk.StringList();
    positionSetting.append(_("Left"), "0");
    positionSetting.append(_("Clock left"), "1");
    positionSetting.append(_("Clock left centered"), "2");
    positionSetting.append(_("Clock right centered"), "3");
    positionSetting.append(_("Clock right"), "4");
    positionSetting.append(_("Right"), "5");

    let unitSetting = new Gtk.StringList();
    unitSetting.append(_("Celsius"), "0");
    unitSetting.append(_("Fahrenheit"), "1");

    // Setup preferences
    window._settings = this.getSettings();

    const positionRow = new Adw.ComboRow({
      title: _("Position"),
      subtitle: _("Select where to show the weather indicator on the panel"),
      model: positionSetting,
      selected: window._settings.get_enum("position"),
    });
    appearancePrefsGroup.add(positionRow);

    const unitRow = new Adw.ComboRow({
      title: _("Unit"),
      subtitle: _("Select the temperature unit to display"),
      model: unitSetting,
      selected: window._settings.get_enum("unit"),
    });
    appearancePrefsGroup.add(unitRow);

    const latitudeRow = new Adw.EntryRow({
      title: _("Latitude"),
      text: window._settings.get_double("latitude").toString(),
    });
    locationPrefsGroup.add(latitudeRow);

    const longitudeRow = new Adw.EntryRow({
      title: _("Longitude"),
      text: window._settings.get_double("longitude").toString(),
    });
    locationPrefsGroup.add(longitudeRow);

    // Connect the preferences to the keys
    positionRow.connect("notify::selected", (widget) => {
      window._settings.set_enum("position", widget.selected);
    });

    unitRow.connect("notify::selected", (widget) => {
      window._settings.set_enum("unit", widget.selected);
    });

    latitudeRow.connect("changed", (widget) => {
      const value = parseFloat(widget.get_text());

      if (!isNaN(value) && value >= -90 && value <= 90) {
        window._settings.set_double("latitude", value);
        widget.remove_css_class("error");
      } else {
        widget.add_css_class("error");
      }
    });

    longitudeRow.connect("changed", (widget) => {
      const value = parseFloat(widget.get_text());

      if (!isNaN(value) && value >= -180 && value <= 180) {
        window._settings.set_double("longitude", value);
        widget.remove_css_class("error");
      } else {
        widget.add_css_class("error");
      }
    });
  }
}
