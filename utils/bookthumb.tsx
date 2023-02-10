/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */

export default function BookThumb(props: any) {
  return <img {...props} src={'/api/book/'+ props.id + '/thumb'} />
}