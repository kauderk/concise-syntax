const testVsCode = {
  root: '.view-lines>div>span',
  controlKeyword: 'mtk10',
  blank: 'mtk1',
  jsxMarker: 'mtk13',
  text: 'mtk34',
  jsxTag: 'mtk14',
  jsxBracket: 'mtk17',
  quotationMark: 'mtk20',
  bracket: 'bracket-highlighting',
  glue: 'mtki',
  quote: 'mtk4',
  brace: 'mtk5',
  colon: 'mtk19',
  other: 'mtk12',
  endJsx: 'mtk1',
  get derived() {
    return {
      singleLineControlKeyword: `${this.controlKeyword}.${this.glue}+.${this.text}`,
      quotaionMarkBlank: this.blank,
      quotaionMarkJsxMarker: this.controlKeyword,
      singleQuote: true,
    }
  },
}

const webVsCode = {
  root: '.view-lines>div>span',
  controlKeyword: 'mtk4',
  blank: 'mtk1',
  jsxMarker: 'mtk18',
  text: 'mtk16',
  jsxTag: 'mtk8',
  jsxBracket: 'mtk4',
  quotationMark: 'mtk9',
  bracket: 'bracket-highlighting',
  glue: 'mtk1',
  quote: 'mtk9',
  brace: 'mtk1',
  colon: 'mtk5',
  other: 'mtk16',
  endJsx: 'mtk17',
  get derived() {
    return {
      singleLineControlKeyword: `${this.controlKeyword}+.${this.glue}`,
      quotaionMarkBlank: this.blank,
      quotaionMarkJsxMarker: this.controlKeyword,
      singleQuote: false,
    }
  },
} satisfies typeof testVsCode

const emptyVsCode = {
  root: '.view-lines>div>span',
  controlKeyword: 'mtk18',
  blank: 'mtk1',
  jsxMarker: 'mtk14',
  text: 'mtk21',
  domTag: 'mtk6',
  jsxTag: 'mtk17',
  jsxBracket: 'mtk6',
  quotationMark: 'mtk12',
  bracket: 'bracket-highlighting',
  glue: 'mtk23',
  quote: 'mtk4',
  brace: 'mtk1',
  colon: 'mtk6',
  other: 'mtk12',
  endJsx: 'mtk22',
  get derived() {
    return {
      singleLineControlKeyword: `${this.controlKeyword}+.${this.glue}`,
      quotaionMarkBlank: this.glue,
      quotaionMarkJsxMarker: 'mtk3',
      singleQuote: false,
    }
  },
}

// prettier-ignore
const generateStyles = ({derived,...table}: typeof testVsCode & {domTag?:string}) => `
/* note: using ".view-lines>div>" to increase specificity/perforrmance */

/* jsx begin ( ) and end } */
${table.root}:has(.${table.controlKeyword}:nth-child(2)+.${table.blank}+.${table.blank}[class*='${table.bracket}']:last-child) :is(:last-child,:nth-child(2)),
${table.root}:has(.${table.blank}:first-child+.${table.blank}[class*='${table.bracket}']+.${table.endJsx}:last-child),
${table.root} > [class*='${table.bracket}']:first-child:last-child,

/* jsx closing tag: </tag> */                         /*jsx or marko*/
${table.root}:has(:nth-last-child(3).${table.jsxMarker}+:is(.${table.jsxTag},.${table.domTag},.${table.controlKeyword})+.${table.jsxMarker}) :is(:nth-last-child(3),:nth-last-child(2),:last-child),
/* jsx closing tag: </tag> in between text */
${table.root}:has(:nth-last-child(5).${table.text}+.${table.jsxMarker}+:is(.${table.jsxTag},.${table.domTag})+.${table.jsxMarker}+.${table.endJsx}) :is(:nth-last-child(4),:nth-last-child(3),:nth-last-child(2),:last-child),
/* jsx closing tag: </tag after text */
${table.root}:has(:nth-last-child(3).${table.text}:not(:first-child)+.${table.jsxMarker}+.${table.jsxTag}) :is(:nth-last-child(2),:last-child),
/* jsx attributes { } */
${table.root} .${table.jsxBracket}[class*='${table.bracket}'],


/* <tag> the first one in a line */
${table.root} :nth-child(2)[class="${table.jsxMarker}"],
${table.root} :nth-child(2)[class="${table.jsxMarker}"]+.${table.jsxTag}+.${table.jsxMarker},
/* > after jsx attribute } */                                             /* it should ignore its own kind, or the bracket that is actual javascript*/
${table.root} .${table.jsxBracket}[class*='${table.bracket}']+.${table.jsxMarker}:not(:is(.${table.bracket}-3,.${table.bracket}-4,.${table.bracket}-1)),
/* last > after jsx attribute } */
${table.root} .${table.jsxBracket}+.${table.jsxMarker}+.${table.jsxMarker}:last-child,


/* > after marko } in single line */
${table.root}:has(.${table.text}+.${table.text}.${table.bracket}-0+.${table.jsxMarker}) :last-child,
/* > after marko ) in line end */
${table.root}:has(.${table.blank}:nth-last-child(2)+.${table.jsxMarker}) :last-child,
/* > after marko variable in line end */
${table.root}:has(:nth-last-child(2).${table.jsxMarker}) :first-child.${table.jsxMarker}+:last-child.${table.jsxMarker},
/* /> after marko variable */
${table.root}:has(.${table.blank}+.${table.controlKeyword}+.${table.jsxMarker}+.${table.jsxMarker}:last-child) :last-child,

/* > after a quotation marks */
${table.root}:has(:nth-last-child(2).${table.quotationMark}) :last-child.${table.jsxMarker},
/* > before text 
${table.root} .${table.jsxMarker}:has(+ .${table.text}), */


/* < */
${table.root}>.${table.jsxMarker}:first-child,
${table.root}:has(:nth-child(3).${table.jsxTag}) :nth-child(2).${table.jsxMarker},
/* < after the return keyword */
${table.root}:has(:nth-child(2).${derived.singleLineControlKeyword}+.${table.jsxMarker}+:is(.${table.jsxTag},.${table.domTag})) :nth-child(4).${table.jsxMarker},

/* quotation marks ${derived.singleQuote ? '*/': ''}
${table.root} .${table.quotationMark}:not(:last-child):not(:has(+ :is(.${table.jsxMarker},.${table.other},.${table.quotationMark},.${table.jsxBracket},.${table.blank},.${table.quotationMark}+.${table.text}))),
${table.root} .${table.quote}+.${table.quotationMark},
${!derived.singleQuote ? '*/': ''}

/* jsx ternary operation ? ( ) : null } */
${table.root}:has(.${derived.quotaionMarkBlank}+.${derived.quotaionMarkJsxMarker}+.${derived.quotaionMarkBlank}+.${table.bracket}-4:last-child) :last-child,
${table.root}:has(.${derived.quotaionMarkBlank}+.${table.bracket}-4+.${derived.quotaionMarkBlank}+.${derived.quotaionMarkJsxMarker}+.${derived.quotaionMarkBlank}+.${table.colon}+.${table.bracket}-3:last-child),


/* svelte {#block } {/block} operators */
${table.root}:has(.${table.blank}.${table.bracket}-0:nth-child(2):not(:last-child)) :is(:nth-child(1),:nth-child(2),:nth-child(3),:last-child),
${table.root}:has(:nth-child(3)):has(.${table.blank}.${table.bracket}-0:nth-child(2)):not(:has(:nth-child(6))),


/* marko <if( )>< operators - bug, it triggers one selector above*/
${table.root}:has(.${table.blank}.${table.bracket}-0:nth-child(4):not(:last-child)) :is(:nth-child(4),:nth-last-child(2),:last-child),


/* marko end line ( )*/
${table.root}:has(:is(.${table.brace},.${table.text})+.${table.blank}.${table.bracket}-0:last-child) :last-child {
    opacity: 0.5;
    &:hover {
      opacity: 1;
    }
  }
`;

const styles = generateStyles(emptyVsCode)
console.log(styles)
