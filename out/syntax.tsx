// @ts-nocheck
function Syntax(props) {
  const ref = useRef()
  return (
    <div class="form__group">
      <input
        style={{
          'border-bottom': props.hasUnderline ? '2px solid #9b9b9b' : '',
        }}
        onInput={(event) => {
          props.text = event.target.value
        }}
        required={true}
      />
      {props.trailingIcon ? (
        <label
          class={'form__label' + (props.leadingIcon ? 'pl-6' : '')}
        >
          <For each={[]}>
            {(item, index) => {
              const i = index();
              return <li key={i}>Test</li>
            }}
          </For>
        </label>
      ) : null}
      <span
        style={{
          color: 'blue',
        }}
      >
        Hello Concise Syntax!
      </span>
      <style>{`
				.form__group {
					position: relative;
					padding: 15px 0 0;
					margin-top: 10px;
				}
			`}</style>
    </div>
  )
}
