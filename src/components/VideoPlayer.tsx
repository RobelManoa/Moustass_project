export default function VideoPlayer({ url }: { url: string }) {
  return (
    <video width="400" controls>
      <source src={url} />
    </video>
  );
}