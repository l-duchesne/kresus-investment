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
from woob.browser.filters.html import AbsoluteLink, TableCell, Link
from woob.browser.filters.standard import CleanText, CleanDecimal, Date,Coalesce
from woob.capabilities import NotAvailable
from woob.capabilities.bank import Account, Investment, Transaction
from woob.tools.capabilities.bank.investments import IsinType
from woob.browser.pages import HTMLPage, LoggedPage, pagination


class LoginPage(HTMLPage):
    def login(self, login, passwd):
        form = self.get_form(id='login')
        form['username'] = login
        form['password'] = passwd
        form.submit()


class AccountsList(LoggedPage, HTMLPage):
    @method
    class get_contracts(ListElement):
        item_xpath = '//article[contains(@class, "contract")]'

        class item(ItemElement):
            klass = Account

            obj_label = CleanText('./h3[contains(@class, "contract__name")]/a')
            obj_id = CleanText('./label[contains(@class, "label--primary")]/strong', replace=[(' ', '')])
            obj_balance = CleanDecimal('./span[contains(@class, "contract__price")]', replace_dots=True)
            obj__detail_link = AbsoluteLink('./h3[contains(@class, "contract__name")]/a')
            obj_type = Account.TYPE_LIFE_INSURANCE


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



class AccountHistory(LoggedPage, HTMLPage):
    @method
    class iter_history(ListElement):
        item_xpath = '//div[@class="supports"]/div[contains(@class, "support") and @data-controller]'
        
        class item(ItemElement):
            klass = Transaction
            obj_date =  Date(CleanText('./header/span[contains(@class, "label--primary")]/strong') ,dayfirst=True, default= NotAvailable)
            obj_raw = CleanText('./div[contains(@class, "desktop:gap-4")]/strong', default=NotAvailable)
            obj_label = CleanText('./div[contains(@class, "desktop:gap-4")]/strong', default=NotAvailable)
            obj_amount = CleanDecimal('./div[contains(@class, "desktop:gap-4")]/span', default=NotAvailable)
