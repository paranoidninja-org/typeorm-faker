import { Registry } from "./registry";

export type ProxiedRegistry = Pick<Registry, "getFaker">;

const blacklistedProps: (keyof Registry)[] = ["registerFaker", "reset"];
export const proxiedRegistry = new Proxy(Registry.instance, {
    get(target, prop, receiver) {
        if (typeof prop === "string" && blacklistedProps.includes(prop as keyof Registry)) {
            throw new Error(`Illegal registry property access, accessing: ${prop}`);
        }

        // eslint-disable-next-line
        return Reflect.get(target, prop, receiver);
    },
}) as ProxiedRegistry;
