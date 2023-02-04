/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */

export default function BookThumb(props: any) {
  return <img {...props} src={'/thumbnails/' + props.id + '.jpg'} />
}