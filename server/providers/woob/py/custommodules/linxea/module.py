# -*- coding: utf-8 -*-

# Copyright(C) 2018 Arthur Huillet
#
# This file is part of a woob module.
#
# This woob module is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This woob module is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this woob module. If not, see <http://www.gnu.org/licenses/>.


from woob.capabilities.base import find_object
from woob.capabilities.bank import CapBankWealth, AccountNotFound
from woob.tools.backend import Module, BackendConfig
from woob.tools.value import ValueBackendPassword
from decimal import Decimal
from .browser import Linxea


__all__ = ['LinxeaModule']


class LinxeaModule(Module, CapBankWealth):
    NAME = 'linxea'
    MAINTAINER = 'Duchesne Lucas'
    EMAIL = 'lucasduchesne@gmail.com'
    VERSION = '1.0'
    LICENSE = 'AGPLv3+'
    DESCRIPTION = u'Linxea'
    CONFIG = BackendConfig(
                ValueBackendPassword('login',     label='Identifiant', masked=False, required=True),
                ValueBackendPassword('password',  label='Mot de passe', required=True))
    BROWSER = Linxea

    def create_default_browser(self):
        return self.create_browser(
                self.config['login'].get(),
                self.config['password'].get()
        )

    def get_account(self, id):
        return find_object(self.iter_accounts(), id=id, error=AccountNotFound)

    def iter_accounts(self):
        return self.browser.get_accounts_list()

    def iter_coming(self, account):
        raise NotImplementedError()

    def iter_history(self, account):
        return self.browser.iter_history(account)

    def iter_investment(self, account):
        return self.browser.iter_investments(account)
