/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  LovelaceCardEditor,
  getLovelace,
  LovelaceCard,
  LovelaceCardConfig,
  createThing,
  fireEvent,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

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
  if (helpers) resolve(helpers);
  if ((window as any).loadCardHelpers) {
    helpers = await (window as any).loadCardHelpers();
    (window as any).cardHelpers = helpers;
    resolve(helpers);
  }
});

// TODO Name your custom element
@customElement('frame-card')
export class FrameCard extends LitElement {
  private _el: TemplateResult | undefined;
  private _card: LovelaceCard | undefined;

  constructor() {
    super();

    this._el = html``;
  }

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('frame-card-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: FrameCardConfig;

  public async getCardSize(): Promise<number> {
    if (!this._card) {
      return 0;
    }

    if (typeof this._card.getCardSize === 'function') {
      return this._card.getCardSize();
    }

    return 1;
  }

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: FrameCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'FrameCard',
      ...config,
    };
  }

  private async _createCard() {
    const ret = (await helpers).createCardElement(this.config?.card);
    ret.hass = this.hass;

    return ret;
  }

  protected async updated(changedProps: PropertyValues) {
    super.updated(changedProps);

    if ( changedProps.has('config')) {
      this._card = await this._createCard();
      if (this._card) {
        this._card.hass = this.hass;

        this._el = html`
          <div>
            <fieldset>
              <legend>${this.config?.label}</legend>
              ${this._card}
            </fieldset>
          </div>
        `;
      }
    }
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    return this._el;
  }

  // https://lit.dev/docs/components/styles/
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
