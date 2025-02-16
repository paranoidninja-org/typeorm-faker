import { EntityFaker } from "./entity-faker";

export class Metadata {
    private static instance: Metadata = new Metadata();
    private entityToFakerMap: Record<string, EntityFaker> = {};

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    static getInstance() {
        return Metadata.instance;
    }

    registerFaker(entityClassName: string, entityFaker: EntityFaker) {
        this.entityToFakerMap[entityClassName] = entityFaker;
    }
}
