// @ts-nocheck

function Test() {
  return (
    <>
      <div class="form__group field flex text-light-text">
        <Show when={props.leadingIcon}>
          <i
            class={
              'form__iconito pt-2 mr-2 transition-all duration-300 ease-in-out' +
              props.leadingIcon
            }
          ></i>
        </Show>
        <input
          class="form__field flex-grow"
          type="input"
          ref={ref!}
          style={{
            'border-bottom': props.hasUnderline ? '2px solid #9b9b9b' : '',
          }}
          placeholder={props.placeholder ?? ''}
          name={props.placeholder ?? ''}
          id={props.id}
          onInput={(event) => {
            props.text = event.target.value
          }}
          value={props.text}
          required={true}
        />
        <Show when={props.hasCloseButton}>
          <i
            class="form__iconito__closito pt-2 pr-5 transition-all duration-300 ease-in-out fa-solid fa-xmark"
            onClick={(event) => {
              props.text = ''
            }}
          >
            Hello World
            {props.label}
          </i>
        </Show>
        <Show when={props.trailingIcon}>
          <i
            class={
              'form__iconito pt-2 pr-5 transition-all duration-300 ease-in-out' +
              props.trailingIcon
            }
          ></i>
        </Show>
        <Show when={props.label}>
          <label
            class={'form__label' + (props.leadingIcon ? 'pl-6' : '')}
            for={props.id}
          >
            <For each={[]}>
              {(item, _index) => {
                const i = _index()
                return <li key={i}>Test</li>
              }}
            </For>
          </label>
        </Show>
        <span
          style={{
            color: 'blue',
          }}
        >
          Hello world
        </span>
      </div>

      <style>{`
.form__group {
  position: relative;
  padding: 15px 0 0;
  margin-top: 10px;
}

.form__field {

  border: 0;
  outline: 0;
  padding: 7px 0;
  background: transparent;
  transition: border-color 0.2s;
}

.form__field:placeholder-shown ~ .form__label {
  cursor: text;
  top: 20px;
}

.form__label {
  position: absolute;
  top: 0;
  display: block;
  transition: 0.2s;
  font-size: 1rem;
  color: #9b9b9b;
}

.form__field:focus {
  padding-bottom: 6px;
  font-weight: 700;
  border-width: 3px;
  border-color: #111f30;
}
.form__field:focus ~ .form__label {
  position: absolute;
  top: 0;
  display: block;
  transition: 0.2s;
  font-size: 1rem;
  color: #111f30;
  font-weight: 700;
}

.form__iconito{
  color: #9b9b9b;
  width: 1rem;
  height: 1rem;
}
.form__iconito__closito{
  color: #9b9b9b;
  width: 1rem;
  height: 1rem;
}

.form__group:focus-within .form__iconito__closito {
  color: red;
  width: 1.25rem;
  height: 1.25rem;
}
.form__group:focus-within .form__iconito {
  color: #111f30;
  width: 1.25rem;
  height: 1.25rem;
}

/* reset input */
.form__field:required, .form__field:invalid {
  box-shadow: none;
}
  `}</style>
    </>
  )
}
