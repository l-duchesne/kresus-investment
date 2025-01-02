import should from 'should';

import { cleanData } from '../../server/controllers/helpers';
import DefaultSettings from '../../shared/default-settings';

describe('Ensure settings without default values are removed when exporting data', () => {
    const UNKNOWN_SETTING = 'unknown-setting';
    const KNOWN_SETTING = 'locale';
    const GHOST_SETTING = 'weboob-version'; // legit weboob: ghost setting
    let world = {
        settings: [
            {
                key: UNKNOWN_SETTING,
                value: 'weird value',
                id: '1',
            },
            {
                key: KNOWN_SETTING,
                value: 'en',
                id: '2',
            },
            {
                key: GHOST_SETTING,
                value: '1.3',
            },
        ],
    };
    let all = cleanData(world);
    it('The unknown setting should be removed from the list', () => {
        DefaultSettings.has(UNKNOWN_SETTING).should.equal(false);
        all.settings.some(s => s.key === UNKNOWN_SETTING).should.equal(false);
    });
    it('The known setting should be kept in the list', () => {
        DefaultSettings.has(KNOWN_SETTING).should.equal(true);
        all.settings.some(s => s.key === KNOWN_SETTING).should.equal(true);
    });
    it('The ghost setting should be removed from the list', () => {
        all.settings.some(s => s.key === GHOST_SETTING).should.equal(false);
    });
});

describe('Ensure transaction rules conditions are properly exported', () => {
    let world = {
        transactionRules: [
            {
                actions: [],

                conditions: [
                    {
                        type: 'label_matches_text',
                    },

                    {
                        type: 'label_matches_regexp',
                    },

                    {
                        type: 'amount_equals',
                    },
                ],
            },
        ],
    };

    it('Should not throw if all conditions types are known', () => {
        const func = () => cleanData(world);
        should.doesNotThrow(func);
    });

    it('Should throw if a condition type is unknown', () => {
        const newWorld = JSON.parse(JSON.stringify(world));
        newWorld.transactionRules[0].conditions[0].type = 'UNKNOWN';
        const func = () => cleanData(newWorld);
        should.throws(func);
    });
});
