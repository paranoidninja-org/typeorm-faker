# `typeorm-faker`

`typeorm-faker` helps you define reusable, typed factories for TypeORM entities.

It focuses on two things:

1. Building entities in memory (`buildOne`, `buildMany`) for unit/integration tests.
2. Creating persisted entities (`createOne`, `createMany`) while automatically saving required foreign-key dependencies first.

## Why this package

When tests need lots of entity shapes, inline object creation quickly becomes noisy and inconsistent.  
This package gives you:

- Centralized entity generators per `DataSource` + entity class.
- Typed field-level generator functions.
- Per-call overrides (literal values or override functions).
- Dependency resolution for `ManyToOne` and supported `OneToOne` relations during save/create.

## Installation

```bash
npm install @paranoidninja/typeorm-faker
```

## Quick start

```ts
import "reflect-metadata";
import { faker } from "@faker-js/faker";
import { Column, DataSource, Entity, PrimaryGeneratedColumn } from "typeorm";
import { registerFaker, registry } from "@paranoidninja/typeorm-faker";

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  nickName!: string | null;
}

const dataSource = new DataSource({
  type: "better-sqlite3",
  database: ":memory:",
  entities: [User],
  synchronize: true,
});

await dataSource.initialize();

registerFaker(dataSource, User, {
  firstName: () => faker.person.firstName(),
  lastName: () => faker.person.lastName(),
});

const userFaker = registry.getFaker(dataSource, User);

const builtUser = await userFaker.buildOne(); // not persisted
const savedUser = await userFaker.createOne(); // persisted
const savedUsers = await userFaker.createMany(5); // persisted array
```

## Core API

### `registerFaker(dataSource, EntityClass, config)`

Registers generator functions for entity fields.

```ts
registerFaker(dataSource, User, {
  firstName: () => faker.person.firstName(),
  lastName: () => faker.person.lastName(),
});
```

### `registry.getFaker(dataSource, EntityClass)`

Returns an `EntityFaker<T>` instance for the registered entity.

### `EntityFaker` methods

- `buildOne(overrides?)`: Build one entity instance in memory.
- `buildMany(count, overrides?)`: Build many instances.
- `createOne(overrides?)`: Build + persist one entity.
- `createMany(count, overrides?)`: Build + persist many entities.
- `save(entity | entities)`: Persist already built entity instance(s).

## Usage examples

### Override generated values

You can override any configured field with:

- a literal value, or
- a function that receives `{ registry }`.

```ts
const user = await userFaker.buildOne({
  firstName: "FixedName",
  lastName: () => "FromOverrideFn",
});
```

### Per-item overrides in `buildMany`/`createMany`

Pass an array of overrides to customize each generated item.

```ts
const users = await userFaker.createMany(3, [
  { firstName: "Alice" },
  { firstName: "Bob" },
  { firstName: "Charlie" },
]);
```

### Resolve relation dependencies automatically

If you assign unsaved related entities (for supported FK relations), `create*`/`save` persists dependencies first.

```ts
import { faker } from "@faker-js/faker";
import {
  Column,
  DataSource,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { registerFaker, registry } from "@paranoidninja/typeorm-faker";

@Entity()
class Gender {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @OneToMany(() => User, (user) => user.gender)
  users?: Relation<User[]>;
}

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @ManyToOne(() => Gender, (gender) => gender.users)
  gender?: Relation<Gender>;
}

registerFaker(dataSource, Gender, {
  name: () => faker.person.gender(),
});

registerFaker(dataSource, User, {
  firstName: () => faker.person.firstName(),
  lastName: () => faker.person.lastName(),
});

const userFaker = registry.getFaker(dataSource, User);

const savedUser = await userFaker.createOne({
  gender: ({ registry }) => {
    const genderFaker = registry.getFaker(dataSource, Gender);
    return genderFaker.buildOne(); // unsaved relation object
  },
});
```

### Compose factories across entities

Because overrides receive `{ registry }`, you can chain factory calls and build nested graphs.

```ts
const savedPost = await postFaker.createOne({
  user: ({ registry }) => {
    const userFaker = registry.getFaker(dataSource, User);
    return userFaker.buildOne({
      gender: ({ registry }) => registry.getFaker(dataSource, Gender).buildOne(),
    });
  },
});
```

## Notes

- Faker registrations are unique per `dataSource + entity`. Registering the same entity twice in one `DataSource` throws.
- Accessing a faker for an unregistered entity throws.
- `build*` does not persist; `create*` persists.
- The package imports `reflect-metadata` internally, but your TypeORM app/test setup should still initialize metadata the same way you usually do.
