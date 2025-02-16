import { Faker } from "./faker";

export class Metadata {
    private static instance: Metadata = new Metadata();
    private entityToFakerMap: Record<string, Faker> = {};

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    static getInstance() {
        return Metadata.instance;
    }

    registerFaker(entityClassName: string, entityFaker: Faker) {
        this.entityToFakerMap[entityClassName] = entityFaker;
    }
}
