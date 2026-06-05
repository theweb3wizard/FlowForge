type UserAvatarProps = {
  address: string;
};

export function UserAvatar({ address }: UserAvatarProps) {
  const initials = address.slice(2, 4).toUpperCase();

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
