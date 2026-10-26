export default function SupportMessageText({ text }) {
  return text.split('\n').map((line, index) => <span key={index}>
    {index > 0 && '\n'}
    {/^\/traveler(?:[\/#][a-zA-Z0-9_/#-]*)?$/.test(line)
      ? <a href={line} target="_blank" rel="noreferrer">View details</a>
      : line}
  </span>)
}
