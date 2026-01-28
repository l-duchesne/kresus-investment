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


from woob.browser.elements import ListElement, TableElement, ItemElement, method
from woob.browser.filters.html import AbsoluteLink, TableCell, Link,Attr
from woob.browser.filters.standard import CleanText, CleanDecimal, Date,Coalesce,Currency,Regexp
from woob.capabilities import NotAvailable
from woob.capabilities.bank import Account, Investment, Transaction
from woob.tools.capabilities.bank.investments import IsinType
from woob.browser.pages import HTMLPage, LoggedPage, pagination
from woob.browser.selenium import SeleniumPage


class LoginPage(SeleniumPage):
    def login(self, login, passwd):
        el = self.driver.find_element_by_xpath('//input[@id="userName"]')
        el.send_keys(login)
        el = self.driver.find_element_by_xpath('//input[@id="password"]')
        el.send_keys(passwd)

        el = self.driver.find_element_by_xpath('//button[@type="submit"]')
        el.click()
        
    def get_error_msg(self):
        return CleanText('//p[@data-testid="validation-message"]')(self.doc)

        


class AccountsList(LoggedPage, SeleniumPage):
    @method
    class get_contracts(ListElement):
        item_xpath = '//section[contains(@class, "contract-list-container")]/div'

        class item(ItemElement):
            klass = Account
            
            obj_label = CleanText('./h2[contains(@class, "product-name")]')
            obj_id =  Regexp(Attr('./div/div/a[contains(@class, "btn-details")]', 'href'), r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
            obj_balance = CleanDecimal(Regexp(CleanText('./div/div/div/div/div/div/div/h1[contains(@class, "total-balance")]'),r'(.*?)€'), replace_dots=True, default=NotAvailable)
            obj_number =  Regexp(Attr('./div/div/a[contains(@class, "btn-details")]', 'href'), r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
            #obj__detail_link = Link('./div/a[contains(@class, "btn-details")]')
            obj_type = Account.TYPE_LIFE_INSURANCE
            
    @method
    class iter_history(ListElement):
        item_xpath = '//div[contains(@class,"ring-primary operation-card")]'

        class item(ItemElement):
            klass = Transaction
            obj_date = Date(CleanText('./div[contains(@class, "operation-card__header__info")]/p'), dayfirst=True, default=NotAvailable)
            obj_raw = CleanText('./div[contains(@class, "operation-card__header__info--iconTitle")]/p')
            obj_label = CleanText('./div[contains(@class, "operation-card__header__info--iconTitle")]/p')
            obj_amount = CleanDecimal('./span[contains(@class, "ant-statistic-content-value-int")]', replace_dots=True, default=NotAvailable)

class InvestmentList(LoggedPage, HTMLPage):
    @method
    class iter_investments(ListElement):
        item_xpath = '//div[@class="supports"]/div[contains(@class, "support") and not(@data-controller)]'
        class item(ItemElement):
            klass = Investment
            obj_label =  Coalesce(CleanText('./span[contains(@class, "support__title")]/strong'),
                                  CleanText('./span[contains(@class, "support__title")]/a'),
                                    default="No Label")
            obj_description = obj_label
            obj_valuation = CleanDecimal('./span[contains(@class, "support__title")]/span', replace_dots=True, default=NotAvailable)
            obj_diff_percent = CleanDecimal('./span[contains(@class, "support__performance")]/strong', replace_dots=True, default=NotAvailable)
            obj_code = CleanText('./header/span[contains(@class, "label--monochrome-secondary")]/strong', default=NotAvailable)
            obj_code_type = IsinType( CleanText('./header/span[contains(@class, "label--monochrome-secondary")]/strong'))
            obj_quantity = CleanDecimal('./header/span[contains(text(), "Nbre de parts")]/strong', replace_dots=True, default=NotAvailable)
            obj_unitprice = CleanDecimal('./header/span[contains(text(), "Valeur liquidative")]/strong', replace_dots=True, default=NotAvailable)
            obj_vdate = Date(CleanText('./header/span[contains(text(), "Date de cotation")]/strong'), dayfirst=True, default=NotAvailable)



class AccountHistory(LoggedPage, SeleniumPage):
    @method
    class iter_history(ListElement):
        item_xpath = '//div[contains(@class,"ring-primary operation-card")]'

        class item(ItemElement):
            klass = Transaction
            obj_date = Date(CleanText('./div[contains(@class, "operation-card__header__info")]/p'), dayfirst=True, default=NotAvailable)
            obj_raw = CleanText('./div[contains(@class, "operation-card__header__info--iconTitle")]/p')
            obj_label = CleanText('./div[contains(@class, "operation-card__header__info--iconTitle")]/p')
            obj_amount = CleanDecimal('./span[contains(@class, "ant-statistic-content-value-int")]', replace_dots=True, default=NotAvailable)

