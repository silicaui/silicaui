/**
 * Le seul JavaScript que j'écris.
 *
 * Charger @wizeworks/silicaui-behaviors NE SUFFIT PAS: le paquet exporte
 * `hydrate` et ne s'appelle pas tout seul. Il faut donc ce fichier — un module,
 * chargé par <script type="module" src>, parce que la CSP interdit l'inline.
 */
import { hydrate } from "./behaviors.js";

hydrate();
