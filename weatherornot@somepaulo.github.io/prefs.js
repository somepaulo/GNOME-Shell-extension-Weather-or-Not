import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class WeatherOrNotExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(prefsWindow) {
        // Create a preferences page, with a single group
        const prefsPage = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-other-symbolic',
        });
        prefsWindow.add(prefsPage);

        const prefsGroup = new Adw.PreferencesGroup({
            title: _('Appearance'),
        });
        prefsPage.add(prefsGroup);

        // Create a list of options for the preferences row
        let positionSetting = new Gtk.StringList();
        positionSetting.append(_('Left'), '0');
        positionSetting.append(_('Clock left'), '1');
        positionSetting.append(_('Clock left centered'), '2');
        positionSetting.append(_('Clock right centered'), '3');
        positionSetting.append(_('Clock right'), '4');
        positionSetting.append(_('Right'), '5');

        // Create a preferences row
        window._settings = this.getSettings();
        const positionRow = new Adw.ComboRow({
            title: _('Position'),
            subtitle: _('Select where to show the weather indicator on the panel'),
            model: positionSetting,
            selected: window._settings.get_enum('position')
        });
        prefsGroup.add(positionRow);

        // Connect the preferences row to the `position` key
        positionRow.connect('notify::selected', (widget) => {
            window._settings.set_enum('position', widget.selected);
        });
    }
}
