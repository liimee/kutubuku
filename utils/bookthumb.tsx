/* eslint-disable jsx-a11y/alt-text */
import Image from "next/image";

export default function BookThumb(props: any) {
  return <Image width={150} height={260} {...props} src={'/thumbnails/' + props.id + '.jpg'} />
}