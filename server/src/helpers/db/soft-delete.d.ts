import "knex";
declare module "knex" {
  namespace Knex {
    interface QueryBuilder<TRecord extends {} = any, TResult = any> {
      softDelete(): Knex.QueryBuilder<TRecord, TResult>;
    }
  }
}

export function attachSoftDelete(): void;
