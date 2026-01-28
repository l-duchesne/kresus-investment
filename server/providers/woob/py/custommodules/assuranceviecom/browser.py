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


from woob.browser import LoginBrowser, URL, need_login
from woob.exceptions import BrowserIncorrectPassword

from .pages import LoginPage, AccountsList, InvestmentList, AccountHistory

__all__ = ['AssuranceVieCom']


class AssuranceVieCom(LoginBrowser):
    BASEURL = 'https://www.assurancevie.com'

    login_page = URL('/asv/espace-client/connexion', LoginPage)
    investments_page = URL('/asv/espace-client/contrat', InvestmentList)
    accounts_page = URL('/asv/espace-client', AccountsList)
    summary_page = URL('/group/eclient.*tabulateur.tabulation.resume', None)
    history_page = URL('/asv/espace-client/contrat', AccountHistory)

#        detail_link does not contain the type of page. the suffix for the pages are:
#        résumé
#        _portletespaceClientmonCompte_WAR_portletespaceclient_INSTANCE_Q4n1_tabName=detailsContrat.tabulateur.tabulation.resume
#        mes supports
#        _portletespaceClientmonCompte_WAR_portletespaceclient_INSTANCE_Q4n1_tabName=detailsContrat.tabulateur.tabulation.supports
#        mes opérations
#        _portletespaceClientmonCompte_WAR_portletespaceclient_INSTANCE_Q4n1_tabName=detailsContrat.tabulateur.tabulation.operations

    def __init__(self,  *args, **kwargs):
        LoginBrowser.__init__(self, *args, **kwargs)

    def do_login(self):
        self.login_page.stay_or_go().login(self.username, self.password)

        if self.login_page.is_here():
            raise BrowserIncorrectPassword()

    @need_login
    def get_accounts_list(self):
        self.accounts_page.stay_or_go()
        return self.page.get_contracts()

    @need_login
    def iter_investments(self, account):
        if hasattr(account, '_detail_link'):
            self.location(account._detail_link)
            return self.page.iter_investments()
        return []

    @need_login
    def iter_history(self, account):
        return []
