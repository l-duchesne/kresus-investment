import {
    In,
    Between,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    ManyToOne,
    Repository,
    DeepPartial,
    FindManyOptions,
} from 'typeorm';

import { getRepository } from '..';

import User from './users';
import Account from './accounts';

import { UNKNOWN_TRANSACTION_TYPE, unwrap } from '../../helpers';
import { ForceNumericColumn, DatetimeType, bulkInsert } from '../helpers';

// Whenever you're adding something to the model, don't forget to modify
// the mergeWith function in the helpers file.

@Entity('investment')
export default class Investment {
    private static REPO: Repository<Investment> | null = null;

    private static repo(): Repository<Investment> {
        if (Investment.REPO === null) {
            Investment.REPO = getRepository(Investment);
        }
        return Investment.REPO;
    }

    @PrimaryGeneratedColumn()
    id!: number;

    // ************************************************************************
    // EXTERNAL LINKS
    // ************************************************************************

    @ManyToOne(() => User, { cascade: true, onDelete: 'CASCADE', nullable: false })
    @JoinColumn()
    user!: User;

    @Column('integer')
    userId!: number;

    // Internal account id, to which the transaction is attached
    @ManyToOne(() => Account, { cascade: true, onDelete: 'CASCADE', nullable: false })
    @JoinColumn()
    account!: Account;

    @Column('integer')
    accountId!: number;

    // external (backend) type id or UNKNOWN_TRANSACTION_TYPE.
    @Column('varchar', { default: UNKNOWN_TRANSACTION_TYPE })
    type: string = UNKNOWN_TRANSACTION_TYPE;

    @Column('varchar')
    externalId?: string;


    // ************************************************************************
    // TEXT FIELDS
    // ************************************************************************

    // short summary of what the transaction is about.
    @Column('varchar')
    label!: string;

    @Column('varchar')
    code?: string;
    @Column('varchar')
    stocksymbol?: string;
    @Column('varchar')
    stockmarket?: string;
    @Column('varchar')
    assetcategory?: string;

    // ************************************************************************
    // DATE FIELDS
    // ************************************************************************

    // date at which the transaction has been processed by the backend.
    @Column({ type: DatetimeType })
    date!: Date;


    // ************************************************************************
    // OTHER TRANSACTION FIELDS
    // ************************************************************************

    // amount of the transaction, in a certain currency.
    @Column('numeric', { transformer: new ForceNumericColumn() })
    quantity!: number;
    @Column('numeric', { transformer: new ForceNumericColumn() })
    unitprice!: number;
    @Column('numeric', { transformer: new ForceNumericColumn() })
    unitvalue!: number;
    @Column('numeric', { transformer: new ForceNumericColumn() })
    valuation!: number;
    @Column('numeric', { transformer: new ForceNumericColumn() })
    diff!: number;
    @Column('numeric', { transformer: new ForceNumericColumn() })
    diff_ratio!: number;



    // Methods.



    // mergeWith(other: Investment): DeepPartial<Investment> {
    //    return mergeWith(this, other);
    //    return ""
    // }

    // Static methods

    static renamings = {
        raw: 'rawLabel',
        dateImport: 'importDate',
        title: 'label',
    };

    // Doesn't insert anything in db, only creates a new instance and normalizes its fields.
    static cast(args: Partial<Investment>): Investment {
        return Investment.repo().create(args);
    }

    static async create(userId: number, attributes: Partial<Investment>): Promise<Investment> {
        const entity = Investment.repo().create({ ...attributes, userId });
        return await Investment.repo().save(entity);
    }

    // Note: doesn't return the inserted entities.
    static async bulkCreate(userId: number, investments: Partial<Investment>[]): Promise<void> {
        const fullInvestments = investments.map(tr => {
            return { ...tr, userId };
        });
        return await bulkInsert(Investment.repo(), fullInvestments);
    }

    static async find(userId: number, transactionId: number): Promise<Investment | null> {
        return await Investment.repo().findOne({ where: { userId, id: transactionId } });
    }

    static async all(userId: number): Promise<Investment[]> {
        return await Investment.repo().findBy({ userId });
    }

    static async destroy(userId: number, transactionId: number): Promise<void> {
        await Investment.repo().delete({ userId, id: transactionId });
    }

    static async destroyAll(userId: number): Promise<void> {
        await Investment.repo().delete({ userId });
    }

    static async update(
        userId: number,
        transactionId: number,
        fields: DeepPartial<Investment>
    ): Promise<Investment> {
        await Investment.repo().update({ userId, id: transactionId }, fields);
        return unwrap(await Investment.find(userId, transactionId));
    }

    static async byAccount(
        userId: number,
        accountId: number,
        columns?: string[]
    ): Promise<Investment[]> {
        const options: FindManyOptions = {
            where: {
                userId,
                accountId,
            },
        };

        if (columns && columns.length) {
            options.select = columns;
        }

        return await Investment.repo().find(options);
    }

    static async byAccounts(userId: number, accountIds: number[]): Promise<Investment[]> {
        return await Investment.repo().findBy({ userId, accountId: In(accountIds) });
    }



    static async byType(userId: number, type: string): Promise<Investment[]> {
        return await Investment.repo().findBy({ userId, type: type });
    }


    static async byBankSortedByDateBetweenDates(
        userId: number,
        account: Account,
        minDate: Date,
        maxDate: Date
    ): Promise<Investment[]> {
        return await Investment.repo().find({
            where: {
                userId,
                accountId: account.id,
                date: Between(minDate, maxDate),
            },
            order: {
                date: 'DESC',
            },
        });
    }

    static async destroyByAccount(userId: number, accountId: number): Promise<void> {
        await Investment.repo().delete({ userId, accountId });
    }


    static async replaceAccount(
        userId: number,
        accountId: number,
        replacementAccountId: number
    ): Promise<void> {
        await Investment.repo()
            .createQueryBuilder()
            .update()
            .set({ accountId: replacementAccountId })
            .where({ userId, accountId })
            .execute();
    }

    // Checks the input object has the minimum set of attributes required for being a transaction.
    static isInvestment(input: Partial<Investment>): input is Investment {
        return (
            input.hasOwnProperty('accountId') &&
            input.hasOwnProperty('label') &&
            input.hasOwnProperty('date') &&
            input.hasOwnProperty('amount') &&
            input.hasOwnProperty('type')
        );
    }
}
