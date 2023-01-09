type Obj = Record<string, unknown>;

type Context<C extends Obj> = {
    get: () => Readonly<C>;
    set: (arg: Partial<C>) => void;
};

type TransitionArgs<C extends Obj> = {
    context: Context<C>;
};

type MachineDefinition<S extends Obj, C extends Obj> = {
    context?: C;
    initial: keyof S;
    states: {
        [K in keyof S]: {
            [ON in keyof S[K]]: {
                [E in keyof S[K][ON]]: (args: TransitionArgs<C>) => keyof S;
            };
        };
    };
};

type GenericMachine<States = any, Args extends Obj = any> = {
    state: () => States;
    send: (args: Args) => void;
};

type Machine<S extends Obj> = GenericMachine<
    keyof S,
    { event: ExtractEvents<MachineDefinition<S, any>> }
>;

type ExtractEvents<M extends MachineDefinition<any, any>> = {
    [K in keyof M["states"]]: keyof M["states"][K]["on"];
}[keyof M["states"]];

function createMachine<S extends Obj, C extends Obj>(machine: MachineDefinition<S, C>): Machine<S> {
    let state = machine.initial;
    let contextData = machine.context !== undefined ? { ...machine.context } : {} as C;

    const context: Context<C> = {
        get() {
            return Object.freeze(contextData);
        },
        set(newProps) {
            contextData = {
                ...contextData,
                ...newProps
            }
        }
    };

    function send(action: { event: ExtractEvents<MachineDefinition<S, C>> }) {
        // @ts-ignore
        const transitionFn = machine["states"][state]["on"][action.event as any];
        if (transitionFn !== undefined) {
            state = transitionFn({ context });
        }
    }

    function stateGetter() {
        return state;
    }

    return {
        send,
        state: stateGetter,
    };
}

export type { GenericMachine, Machine, MachineDefinition };
export { createMachine };
