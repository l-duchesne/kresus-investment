import { Table, MigrationInterface, QueryRunner } from 'typeorm';
import { datetimeType, foreignKey, foreignKeyUserId, idColumn } from '../helpers';


export class MigrateDb1735997589468 implements MigrationInterface {
    async up(q: QueryRunner): Promise<void> {

        // investment table.
        await q.createTable(
            new Table({
                // CREATE TABLE "investment"
                name: 'investment',

                columns: [
                    // "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                    idColumn(),

                    // "userId" integer NOT NULL,
                    {
                        name: 'userId',
                        type: 'integer',
                    },

                    // "accountId" integer NOT NULL,
                    {
                        name: 'accountId',
                        type: 'integer',
                    },

                    // "externalId" integer NOT NULL,
                    {
                        name: 'externalId',
                        type: 'varchar',
                    },

                    {
                        name: 'type',
                        type: 'varchar',
                    },

                    // "label" varchar NOT NULL,
                    {
                        name: 'label',
                        type: 'varchar',
                    },

                    {
                        name: 'code',
                        type: 'varchar',
                        isNullable: true,
                    },

                    {
                        name: 'stocksymbol',
                        type: 'varchar',
                        isNullable: true,
                    },

                    {
                        name: 'stockmarket',
                        type: 'varchar',
                        isNullable: true,
                    },

                    {
                        name: 'assetcategory',
                        type: 'varchar',
                        isNullable: true,
                    },
                    // "date" date NOT NULL,
                    {
                        name: 'date',
                        type: datetimeType(q),
                    },


                    // "quantity" numeric NOT NULL,
                    {
                        name: 'quantity',
                        type: 'numeric',
                        isNullable: true,
                    },
                    // "unitprice" numeric NOT NULL,
                    {
                        name: 'unitprice',
                        type: 'numeric',
                        isNullable: true,
                    },
                    // "unitvalue" numeric NOT NULL,
                    {
                        name: 'unitvalue',
                        type: 'numeric',
                        isNullable: true,
                    },
                    // "valuation" numeric NOT NULL,
                    {
                        name: 'valuation',
                        type: 'numeric',
                    },
                    // "diff" numeric NOT NULL,
                    {
                        name: 'diff',
                        type: 'numeric',
                        isNullable: true,
                    },
                    // "diff_ratio" numeric NOT NULL,
                    {
                        name: 'diff_ratio',
                        type: 'numeric',
                        isNullable: true,
                    },
                ],

                foreignKeys: [
                    // CONSTRAINT "investemnt_ref_user_id" FOREIGN KEY ("userId") REFERENCES
                    // "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)
                    foreignKeyUserId('investemnt'),

                    // CONSTRAINT "investemnt_ref_account_id" FOREIGN KEY ("accountId") REFERENCES
                    // "account" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                    foreignKey('investemnt_ref_account_id', 'accountId', 'account', 'id'),
                ],
            })
        );
    }

    async down(q: QueryRunner): Promise<void> {
        await q.dropTable('investment');
    }
}