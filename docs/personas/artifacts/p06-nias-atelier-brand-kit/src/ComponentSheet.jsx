/**
 * La planche de composants — le test de portée de la revendication N-color.
 *
 * Une seule fonction, appelée deux fois: une avec `terracotta` (inventée il y a
 * une heure) et une avec `primary` (livrée avec le produit). Si la
 * revendication est vraie, les deux planches sont identiques à la couleur près.
 *
 * Le persona demande 20 composants au minimum. Il y en a 32 ici, choisis pour
 * couvrir les 38 familles que le greffon émet, pas pour faire du nombre.
 */
import {
  Alert, Autocomplete, Avatar, Badge, Button, Calendar, Checkbox, CheckboxGroup,
  CheckboxOption, ChatBubble, DateInput, Dock, Filter, Input, Link, Meter,
  NativeSelect, Pagination, PasswordInput, PinInput, Progress, RadialProgress,
  Radio, RadioGroup, RadioOption, Range, Rating, SearchInput, Slider, Status,
  Step, Steps, Switch, TagInput, Textarea, Toggle, Wordmark,
} from "@wizeworks/silicaui-react";

/** Un composant, son nom, et la famille CSS qu'il exerce. */
function Cell({ name, family, children }) {
  return (
    <div className="flex flex-col gap-2 min-w-0" data-cell={name} data-family={family}>
      <span className="text-sm text-base-content font-medium">{name}</span>
      <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full overflow-x-auto">{children}</div>
    </div>
  );
}

export default function ComponentSheet({ color, idPrefix }) {
  const c = color;
  return (
    <div
      className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      data-sheet={color}
    >
      <Cell name="Button" family="btn">
        <Button color={c}>Commander</Button>
        <Button color={c} variant="outline">Devis</Button>
        <Button color={c} variant="soft">Aperçu</Button>
      </Cell>

      <Cell name="Badge" family="badge">
        <Badge color={c}>Édition 2026</Badge>
        <Badge color={c} variant="outline">Épuisé</Badge>
      </Cell>

      <Cell name="Alert" family="alert">
        <Alert color={c}>La palette est enregistrée.</Alert>
      </Cell>

      <Cell name="Avatar" family="avatar">
        <Avatar color={c}>NA</Avatar>
        <Avatar color={c} ring>TO</Avatar>
      </Cell>

      <Cell name="Progress" family="progress">
        <Progress color={c} value={62} max={100} className="w-40" />
      </Cell>

      <Cell name="RadialProgress" family="radial-progress">
        <RadialProgress color={c} value={62} />
      </Cell>

      <Cell name="Meter" family="meter">
        <Meter color={c} value={0.62} label="Stock" showValue className="w-40" />
      </Cell>

      <Cell name="Status" family="status">
        <Status color={c} label="En atelier" />
        <Status color={c} ping label="En cours" />
      </Cell>

      <Cell name="Link" family="link">
        <Link color={c} href="#palette">Retour à la palette</Link>
      </Cell>

      <Cell name="Rating" family="rating">
        <Rating color={c} defaultValue={4} max={5} label="Note de l'atelier" />
      </Cell>

      <Cell name="Pagination" family="pagination">
        <Pagination color={c} page={2} count={7} />
      </Cell>

      <Cell name="Input" family="input">
        <Input color={c} defaultValue="Nia Adeyemi" aria-label="Nom" />
      </Cell>

      <Cell name="PasswordInput" family="input">
        <PasswordInput color={c} defaultValue="terracotta" aria-label="Mot de passe" />
      </Cell>

      <Cell name="SearchInput" family="input">
        <SearchInput color={c} defaultValue="bone" aria-label="Recherche" />
      </Cell>

      <Cell name="Textarea" family="textarea">
        <Textarea color={c} defaultValue="Une maison de style est un jeu de promesses." aria-label="Notes" />
      </Cell>

      <Cell name="NativeSelect" family="select">
        <NativeSelect color={c} defaultValue="clay" aria-label="Palette">
          <option value="clay">atelier-clay</option>
          <option value="ink">atelier-ink</option>
        </NativeSelect>
      </Cell>

      <Cell name="PinInput" family="pin-input-cell">
        <PinInput color={c} length={4} defaultValue="38" aria-label="Code" />
      </Cell>

      <Cell name="Autocomplete" family="input">
        <Autocomplete color={c} items={["terracotta", "bone", "ironwood", "verdigris"]} defaultValue="bone" aria-label="Rôle" />
      </Cell>

      <Cell name="DateInput" family="calendar">
        <DateInput color={c} defaultValue={new Date(2026, 8, 19)} aria-label="Livraison" />
      </Cell>

      <Cell name="Calendar" family="calendar">
        <Calendar color={c} defaultMonth={new Date(2026, 8, 1)} defaultValue={new Date(2026, 8, 19)} />
      </Cell>

      <Cell name="Checkbox" family="checkbox">
        <Checkbox color={c} defaultChecked aria-label="Inclure la rampe sombre" />
      </Cell>

      <Cell name="CheckboxGroup" family="checkbox">
        <CheckboxGroup color={c} defaultValue={["clay"]}>
          <CheckboxOption value="clay">atelier-clay</CheckboxOption>
          <CheckboxOption value="ink">atelier-ink</CheckboxOption>
        </CheckboxGroup>
      </Cell>

      <Cell name="Radio" family="radio">
        <Radio color={c} name={`${idPrefix}-r`} defaultChecked aria-label="Clair" />
      </Cell>

      <Cell name="RadioGroup" family="radio">
        <RadioGroup color={c} name={`${idPrefix}-rg`} defaultValue="clay">
          <RadioOption value="clay">Clair</RadioOption>
          <RadioOption value="ink">Sombre</RadioOption>
        </RadioGroup>
      </Cell>

      <Cell name="Toggle" family="toggle">
        <Toggle color={c} defaultChecked aria-label="Afficher les nombres" />
      </Cell>

      <Cell name="Switch" family="switch">
        <Switch color={c} defaultChecked aria-label="Suivre le système" />
      </Cell>

      <Cell name="Slider" family="slider">
        <Slider color={c} defaultValue={62} showValue className="w-40" aria-label="Chroma" />
      </Cell>

      <Cell name="Range" family="range">
        <Range color={c} defaultValue={38} className="w-40" aria-label="Teinte" />
      </Cell>

      <Cell name="Filter" family="filter">
        <Filter color={c} defaultValue="clay">
          <input type="radio" name={`${idPrefix}-f`} aria-label="clay" value="clay" />
          <input type="radio" name={`${idPrefix}-f`} aria-label="ink" value="ink" />
        </Filter>
      </Cell>

      <Cell name="TagInput" family="tag-input">
        <TagInput color={c} defaultValue={["terracotta", "bone"]} aria-label="Rôles" />
      </Cell>

      <Cell name="Steps" family="step">
        <Steps>
          <Step color={c} data-content="1">Palette</Step>
          <Step color={c} data-content="2">Type</Step>
          <Step data-content="3">Livraison</Step>
        </Steps>
      </Cell>

      <Cell name="ChatBubble" family="chat-bubble">
        <ChatBubble color={c}>Deux crans plus chaud, s'il te plaît.</ChatBubble>
      </Cell>

      <Cell name="Dock" family="dock">
        <Dock color={c}>
          <button type="button" className="dock-item dock-active">Palette</button>
          <button type="button" className="dock-item">Type</button>
        </Dock>
      </Cell>

      <Cell name="Wordmark" family="wordmark">
        <Wordmark color={c}>Nia's Atelier</Wordmark>
      </Cell>
    </div>
  );
}
