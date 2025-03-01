import { faker } from "@faker-js/faker";
import {
    Column,
    DataSource,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
    Repository,
    Tree,
    TreeChildren,
    TreeParent,
} from "typeorm";

import { registerFaker, registry } from "../src";

describe("Faker for tree entity tests", () => {
    @Entity()
    class AdjacencyListCategory {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @ManyToOne(() => AdjacencyListCategory, (category) => category.children)
        parent?: Relation<AdjacencyListCategory>;

        @OneToMany(() => AdjacencyListCategory, (category) => category.parent)
        children?: Relation<AdjacencyListCategory[]>;
    }

    @Entity()
    @Tree("nested-set")
    class NestedSetCategory {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @TreeParent()
        parent?: Relation<AdjacencyListCategory>;

        @TreeChildren()
        children?: Relation<AdjacencyListCategory[]>;
    }

    @Entity()
    @Tree("materialized-path")
    class MaterializedPathCategory {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @TreeParent()
        parent?: Relation<AdjacencyListCategory>;

        @TreeChildren()
        children?: Relation<AdjacencyListCategory[]>;
    }

    @Entity()
    @Tree("closure-table")
    class ClosureTableCategory {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @TreeParent()
        parent?: Relation<AdjacencyListCategory>;

        @TreeChildren()
        children?: Relation<AdjacencyListCategory[]>;
    }

    let dataSource: DataSource;
    let alCategoryRepo: Repository<AdjacencyListCategory>;
    let nsCategoryRepo: Repository<AdjacencyListCategory>;
    let mpCategoryRepo: Repository<AdjacencyListCategory>;
    let ctCategoryRepo: Repository<AdjacencyListCategory>;

    beforeAll(async () => {
        dataSource = new DataSource({
            entities: [AdjacencyListCategory, NestedSetCategory, MaterializedPathCategory, ClosureTableCategory],
            type: "better-sqlite3",
            database: ":memory:",
            synchronize: true,
        });

        await dataSource.initialize();

        alCategoryRepo = dataSource.getRepository(AdjacencyListCategory);
        nsCategoryRepo = dataSource.getRepository(NestedSetCategory);
        mpCategoryRepo = dataSource.getRepository(MaterializedPathCategory);
        ctCategoryRepo = dataSource.getRepository(ClosureTableCategory);
    });

    afterAll(async () => {
        await alCategoryRepo.delete({});
        await nsCategoryRepo.delete({});
        await mpCategoryRepo.delete({});
        await ctCategoryRepo.delete({});

        await dataSource.destroy();
    });

    it.each([AdjacencyListCategory, NestedSetCategory, MaterializedPathCategory, ClosureTableCategory])(
        "should work with tree entity type %s for multiple levels",
        async (entityClass) => {
            registerFaker(dataSource, entityClass, {
                name: () => faker.commerce.product(),
            });
            const repository = dataSource.getRepository(entityClass);

            const categoryFaker = registry.getFaker(dataSource, entityClass);
            const fakeCategory = await categoryFaker.createOne({
                parent: () =>
                    categoryFaker.buildOne({
                        parent: () => categoryFaker.buildOne(),
                    }),
            });

            expect(repository.hasId(fakeCategory)).toBe(true);
            expect(fakeCategory.parent).toBeTruthy();
            expect(repository.hasId(fakeCategory.parent)).toBe(true);
            expect(fakeCategory.parent?.parent).toBeTruthy();
            expect(repository.hasId(fakeCategory.parent!.parent)).toBe(true);
        },
    );
});
