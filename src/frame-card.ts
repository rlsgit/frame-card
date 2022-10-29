/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
// This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers
import {
  HomeAssistant,
  LovelaceCard,
  createThing,
  fireEvent,
  hasConfigOrEntityChanged,
  LovelaceCardConfig,
} from 'custom-card-helpers';

import type { FrameCardConfig } from './types';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  frame-card \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'frame-card',
  name: 'Frame Card',
  description: 'A card wrapper with a frame.',
});

let helpers = (window as any).cardHelpers;
const helperPromise = new Promise(async (resolve) => {
  if (helpers) resolve(true);
  if ((window as any).loadCardHelpers) {
    helpers = await (window as any).loadCardHelpers();
    (window as any).cardHelpers = helpers;
    resolve(true);
  }
});

// TODO Name your custom element
@customElement('frame-card')
export class FrameCard extends LitElement {
  // public static async getConfigElement(): Promise<LovelaceCardEditor> {
  //   await import('./editor');
  //   return document.createElement('frame-card-editor');
  // }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() protected _card?: LovelaceCard;

  @state() private config!: FrameCardConfig;

  set haas(hass) {
    if (this._card) this._card.hass = hass;
  }

  public async getCardSize(): Promise<number> {
    if (!this._card) {
      return 0;
    }

    if (typeof this._card.getCardSize === 'function') {
      return this._card.getCardSize();
    }

    return 1;
  }

  private _createCard(cardConfig: LovelaceCardConfig): LovelaceCard | undefined {
    let ret: LovelaceCard | undefined = undefined;
    if (cardConfig) {
      if (helpers) {
        ret = helpers.createCardElement(cardConfig);
      } else {
        const element = createThing(cardConfig);
        helperPromise.then(() => {
          fireEvent(element, 'll-rebuild', {});
        });
        ret = element;
      }

      if (ret) {
        ret.hass = this.hass;

        ret.addEventListener(
          'll-rebuild',
          (ev) => {
            ev.stopPropagation();
            this._rebuildCard(ret, cardConfig);
          },
          { once: true },
        );
      }
    }

    return ret;
  }

  private _rebuildCard(cardElToReplace: LovelaceCard | undefined, cardConfig: LovelaceCardConfig): void {
    this._card = this._createCard(cardConfig);

    if (this._card && cardElToReplace?.parentElement) {
      cardElToReplace.parentElement.replaceChild(this._card, cardElToReplace);
    }
  }

  public setConfig(config: FrameCardConfig): void {
    if (!config) {
      throw new Error('Invalid configuration');
    }

    // if (config.test_gui) {
    //   getLovelace().setEditMode(true);
    // }

    this.config = {
      name: 'FrameCard',
      ...config,
    };

    this._card = this._createCard(this.config.card);
  }

  protected async updated(changedProps: PropertyValues): Promise<void> {
    super.updated(changedProps);

    if (!this._card || !changedProps.has('hass')) return;

    if (this._card && this.hass) this._card.hass = this.hass;
  }

  protected render(): TemplateResult | void {
    if (!this.config) return html``;

    return html`
      <div>
        <fieldset style="${this.config?.style}">
          <legend style="${this.config?.titleStyle}">${this.config?.title}</legend>
          ${this._card}
        </fieldset>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      /* Defining a custom border on all
            sides except the top side */
      .custom-field {
        border: 2px solid;
      }

      /* Defining the style of the
        heading/legend for custom fieldset */
      .custom-field span {
        float: left;
      }

      /* Creating the custom top border to make
            it look like fieldset defining small
            border before the legend. The width
            can be modified to change position
            of the legend */
      .custom-field span:before {
        border-top: 4px solid;
        content: ' ';
        float: left;
        margin: 8px 2px 0 -1px;
        width: 12px;
      }

      /* Defining a long border after the
        legend, using overflow hidden to
        actually hide the line behind the
        legend text. It can be removed
        for a different effect */
      .custom-field span:after {
        border-top: 4px solid;
        content: ' ';
        display: block;
        height: 24px;
        left: 2px;
        margin: 0 1px 0 0;
        overflow: hidden;
        position: relative;
        top: 8px;
      }
    `;
  }
}
