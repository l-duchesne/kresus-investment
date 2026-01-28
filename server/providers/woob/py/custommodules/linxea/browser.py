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
from woob.browser.selenium import (
    SeleniumBrowser, SubSeleniumMixin, IsHereCondition, webdriver,
)
from .pages import LoginPage, AccountsList, InvestmentList, AccountHistory

__all__ = ['Linxea']


class Linxea(SeleniumBrowser):
    BASEURL = 'https://espaceclient.linxea.com'

    login_page = URL('/identification', LoginPage)
    investments_page = URL('/asv/espace-client/contrat', InvestmentList)
    history_page = URL('/epargne/contrat/(?P<id_account>)/operations', AccountHistory)
    accounts_page = URL('/epargne', AccountsList)
    summary_page = URL('/group/eclient.*tabulateur.tabulation.resume', None)
    HEADLESS = True  # Always change to True for prod

    WINDOW_SIZE = (1800, 1000)
    DRIVER = webdriver.Chrome
#        detail_link does not contain the type of page. the suffix for the pages are:
#        résumé
#        _portletespaceClientmonCompte_WAR_portletespaceclient_INSTANCE_Q4n1_tabName=detailsContrat.tabulateur.tabulation.resume
#        mes supports
#        _portletespaceClientmonCompte_WAR_portletespaceclient_INSTANCE_Q4n1_tabName=detailsContrat.tabulateur.tabulation.supports
#        mes opérations
#        _portletespaceClientmonCompte_WAR_portletespaceclient_INSTANCE_Q4n1_tabName=detailsContrat.tabulateur.tabulation.operations


    def __init__(self, username, password, *args, **kwargs):
        super(Linxea, self).__init__(*args, **kwargs)
        self.selenium_login_transaction_id = None
        self.selenium_device_print = None

        self.selenium_user_agent = None
        self.username = username
        self.password = password

    def _build_options(self, preferences):
        # Linxea login use a library called FingerprintJS
        # It can assert whether or not the user is a bot
        # To successfully pass the login, we have to
        options = super(Linxea, self)._build_options(preferences)
        # Hide the fact that the navigator is controlled by webdriver
        options.add_argument('--disable-blink-features=AutomationControlled')
        # Hardcode an User Agent so we don't expose Chrome is in headless mode
        options.add_argument('user-agent=Mozilla/5.0 (X11; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0')

        return options
    
    def do_login(self):
        
        self.login_page.go()
        self.page.login(self.username, self.password)
        self.wait_until(IsHereCondition(self.accounts_page), timeout=20)
        if self.login_page.is_here():
            msg = self.page.get_error_msg()
            self.logger.error(
                msg
            )
            # Votre e-mail, votre identifiant ou votre mot de passe est incorrect.
            if 'mot de passe est incorrect' in msg:
                raise BrowserIncorrectPassword()
            elif 'Le nombre de tentatives est dépassé, veuillez réessayer dans 10 minutes.' in msg:
                raise BrowserIncorrectPassword()
            raise AssertionError('Unhandled error message at login step: %s', msg)
        
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
        page=self.history_page.go(id_account=account.number)
        
        return page.iter_history()
