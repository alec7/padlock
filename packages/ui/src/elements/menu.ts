import { localize as $l } from "@padlock/core/lib/locale.js";
import { toggleAttribute } from "@padlock/core/lib/util.js";
import { LitElement, html } from "@polymer/lit-element";
import sharedStyles from "../styles/shared.js";
import { animateCascade } from "../animation.js";
import { app } from "../init.js";

class Menu extends LitElement {
    static get properties() {
        return {
            open: Boolean,
            _showingTags: Boolean
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener("click", () => setTimeout(() => (this.open = false), 50));
    }

    _render() {
        const settings: any = {};
        const isTrialExpired = false;
        const isSubUnpaid = false;
        const isSubCanceled = false;
        const isSubValid = false;
        const lastSync = new Date();
        const isSyncing = false;
        const tags: string[] = [];

        return html`
        <style>
            ${sharedStyles}

            @keyframes menuItemIn {
                to { transform: translate3d(0, 0, 0); }
            }

            @keyframes menuItemOut {
                from { transform: translate3d(0, 0, 0); }
            }

            @keyframes tagIn {
                from { transform: translate3d(0, 100px, 0); opacity: 0; }
            }

            :host {
                @apply --fullbleed;
                z-index: -1;
            }

            :host([open]) {
                z-index: 10;
            }

            .menu, .tags {
                position: absolute;
                top: var(--title-bar-height);
                left: var(--main-padding);
                bottom: 0;
                z-index: -2;
                display: flex;
                flex-direction: column;
                width: var(--menu-width);
                box-sizing: border-box;
                color: var(--color-background);
                transition: opacity 0.3s;
            }

            .tags {
                @apply --scroll;
            }

            .menu-item {
                display: flex;
                align-items: center;
                height: 45px;
                justify-content: flex-end;
                position: relative;
                text-align: right;
                flex: none;
            }

            .menu-item > div {
                @apply --ellipsis;
            }

            .menu .menu-item {
                transform: translate3d(calc(var(--menu-icon-width) - var(--menu-width)), 0, 0);
            }

            .menu-item.tag {
                font-size: var(--font-size-small);
                height: 35px;
            }

            .menu-item.tag pl-icon {
                font-size: 90%;
                height: 35px;
                width: 35px;
                margin-right: 5px;
            }

            .menu-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .menu-item > pl-icon {
                width: 45px;
                height: 45px;
                font-size: 120%;
            }

            .menu-item-hint {
                font-size: 12px;
            }

            .last-sync {
                opacity: 0.6;
            }

            .last-sync::before {
                font-family: "FontAwesome";
                font-size: 90%;
                content: "\\f017\\ ";
            }

            .menu-item-hint.warning {
                color: var(--color-error);
            }

            .menu-item-hint.warning::before {
                font-family: "FontAwesome";
                font-size: 85%;
                content: "\\f071\\ ";
                position: relative;
                top: -1px;
            }

            .menu-info {
                font-size: var(--font-size-tiny);
                text-align: center;
                padding: 20px;
                color: rgba(255, 255, 255, 0.5);
                transition: opacity 400ms;
            }

            :host(:not([open])) .menu-info {
                opacity: 0;
            }

            :host([show-tags]) .menu, :host(:not([show-tags])) .tags {
                opacity: 0;
                pointer-events: none;
            }

            .no-tags {
                padding: 0 15px;
                font-size: var(--font-size-small);
                text-align: right;
                width: 130px;
                align-self: flex-end;
            }
        </style>

            <div id="menu" class="menu">

                <div class="spacer"></div>

                <div class="account menu-item tap" on-click="${() => this._openAccountView()}">

                    <div>

                        <div hidden?="${settings.syncConnected}">${$l("Log In")}</div>

                        <div hidden?="${!settings.syncConnected}">${$l("My Account")}</div>

                        <div class="menu-item-hint warning" hidden?="${!isTrialExpired}">${$l("Trial Expired")}</div>

                        <div class="menu-item-hint warning" hidden?="${!isSubUnpaid}">${$l("Payment Failed")}</div>

                        <div class="menu-item-hint warning" hidden?="${!isSubCanceled}">${$l("Subscr. Canceled")}</div>

                    </div>

                    <pl-icon icon="cloud" class="account-icon"></pl-icon>

                </div>

                <div class="menu-item tap" on-click="${() => this.synchronize()}" disabled$="${!isSubValid}">

                    <div>

                        <div>${$l("Synchronize")}</div>

                        <div class="menu-item-hint" hidden?="${settings.syncConnected}">${$l("Log In To Sync")}</div>

                        <div class="menu-item-hint last-sync" hidden?="${!settings.syncConnected}">${lastSync}</div>

                    </div>

                    <pl-icon icon="refresh" spin?="${isSyncing}"></pl-icon>

                </div>

                <div class="menu-item tap" on-click="${() => this._openSettings()}">

                    <div>${$l("Settings")}</div>

                    <pl-icon icon="settings"></pl-icon>

                </div>

                <div class="menu-item tap" on-click="${(e: Event) => this._showTags(e)}">

                    <div>${$l("Tags")}</div>

                    <pl-icon icon="tag"></pl-icon>

                </div>

                <div class="menu-item tap" on-click="${() => this._enableMultiSelect()}">

                    <div>${$l("Multi-Select")}</div>

                    <pl-icon icon="checked"></pl-icon>

                </div>

                <div class="menu-item tap" on-click="${() => app.lock()}">

                    <div>${$l("Lock App")}</div>

                    <pl-icon icon="lock"></pl-icon>

                </div>

                <div class="spacer"></div>

                <div class="menu-info">

                    <div><strong>Padlock ${app.version}</strong></div>

                    <div>Made with ♥ in Germany</div>

                </div>

            </div>

            <div class="tags">

                <div class="spacer"></div>

                <div class="menu-item tap" on-click="${(e: Event) => this._closeTags(e)}">

                    <div>${$l("Tags")}</div>

                    <pl-icon icon="close"></pl-icon>
                </div>

                ${tags.map(
                    (tag: string) => html`
                    <div class="menu-item tag tap" on-click="${() => this._selectTag(tag)}">

                        <div>${tag}</div>

                        <pl-icon icon="tag"></pl-icon>

                    </div>
                `
                )};

                </template>

                <div class="no-tags" disabled hidden?="${!tags.length}">

                    ${$l("You don't have any tags yet!")}

                </div>

                <div class="spacer"></div>

            </div>

        </div>
`;
    }

    _didRender(_: any, changed: any) {
        // TODO
        toggleAttribute((this as any) as Element, "open", this.open);
        toggleAttribute((this as any) as Element, "show-tags", this._showingTags);
        if (changed && changed.open === false) {
            setTimeout(() => (this._showingTags = false), 300);
            this.dispatchEvent(new CustomEvent("menu-close"));
        }
        if (changed && typeof changed.open !== "undefined") {
            animateCascade(this.shadowRoot.querySelectorAll(".menu .menu-item"), {
                animation: this.open ? "menuItemIn" : "menuItemOut",
                duration: 400,
                fullDuration: 600,
                initialDelay: 50,
                fill: "both"
            });
        }
    }

    toggle() {
        this.open = !this.open;
    }

    _openSettings() {
        this.dispatchEvent(new CustomEvent("open-settings"));
    }

    _openAccountView() {
        this.dispatchEvent(new CustomEvent("open-account-view"));
    }

    _showTags(e: Event) {
        this.open = true;
        this._showingTags = true;
        this.animateCascade(this.shadowRoot.querySelectorAll(".tags .menu-item, .no-tags"), {
            animation: "tagIn",
            duration: 400,
            fullDuration: 600,
            fill: "both"
        });
        e.stopPropagation();
    }

    _closeTags(e: Event) {
        this._showingTags = false;
        e.stopPropagation();
    }

    _selectTag(tag: string) {
        setTimeout(() => {
            this.$.listView.filterString = tag;
        }, 350);
    }
}

window.customElements.define("pl-menu", Menu);