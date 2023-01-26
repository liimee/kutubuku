/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
export default function BookThumb(props: any) {
  return <img {...props} src={'/thumbnails/' + props.id + '.jpg'} />
}