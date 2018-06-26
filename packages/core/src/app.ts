import { PrivateKey } from "./crypto";
import { Storable, Storage, LocalStorage } from "./storage";
import { MainStore, SharedStore, Settings } from "./data";
import { Account, AccountID, Session } from "./auth";
import { DateString } from "./encoding";

export class AppMeta implements Storable {
    storageKind = "meta";
    storageKey = "";
    public initialized?: DateString;
    public account?: AccountID;
    public session?: Session;

    async serialize() {
        return {
            account: this.account,
            session: this.session,
            initialized: this.initialized
        };
    }

    async deserialize(raw: any) {
        this.account = raw.account;
        this.session = raw.session;
        this.initialized = raw.initialized;
        return this;
    }
}

export class App {
    meta: AppMeta;
    settings: Settings;
    storage: Storage;
    mainStore: MainStore;
    sharedStores: SharedStore[] = [];
    loaded: Promise<void>;
    account?: Account;

    constructor() {
        this.storage = new LocalStorage();
        this.meta = new AppMeta();
        this.mainStore = new MainStore();
        this.settings = new Settings();
        this.loaded = this.load();
    }

    get privateKey(): PrivateKey {
        return this.mainStore.privateKey;
    }

    get password(): string | undefined {
        return this.mainStore.password;
    }

    set password(pwd: string | undefined) {
        this.mainStore.password = pwd;
    }

    async load() {
        try {
            await this.storage.get(this.meta);
        } catch (e) {
            await this.storage.set(this.meta);
        }
        try {
            await this.storage.get(this.settings);
        } catch (e) {
            await this.storage.set(this.settings);
        }
    }

    async isInitialized(): Promise<boolean> {
        await this.loaded;
        return !!this.meta.initialized;
    }

    async init(password: string) {
        await this.setPassword(password);
        this.meta.initialized = new Date().toISOString();
        await this.storage.set(this.meta);
    }

    async unlock(password: string) {
        this.mainStore.password = password;
        await this.storage.get(this.mainStore);

        // for (const id of this.account!.sharedStores) {
        //     const sharedStore = new SharedStore(id);
        //     sharedStore.account = this.account!;
        //     sharedStore.privateKey = this.privateKey!;
        //     try {
        //         await this.storage.get(sharedStore);
        //         this.sharedStores.push(sharedStore);
        //     } catch (e) {
        //         console.error("Failed to decrypt shared store with id", sharedStore.id, e);
        //     }
        // }
    }

    async setPassword(password: string) {
        this.password = password;
        await this.storage.set(this.mainStore);
    }
    //
    // async createSharedStore(): Promise<SharedStore> {
    //     const store = new SharedStore();
    //     store.account = this.account!;
    //     store.privateKey = this.privateKey;
    //     await store.addMember(this.account!);
    //     await this.storage.set(store);
    //     this.sharedStores.push(store);
    //     this.account!.sharedStores.push(store.id);
    //     await this.storage.set(this.mainStore);
    //     return store;
    // }

    async save() {
        return Promise.all([
            this.storage.set(this.meta),
            this.storage.set(this.mainStore),
            this.storage.set(this.settings),
            ...this.sharedStores.map(s => this.storage.set(s))
        ]);
    }

    async lock() {
        await Promise.all([this.mainStore.clear(), ...this.sharedStores.map(s => s.clear())]);
        this.sharedStores = [];
    }

    async reset() {
        await this.lock();
        await this.storage.clear();
        this.meta = new AppMeta();
        this.loaded = this.load();
    }
}