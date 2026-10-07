const Layout = ({
  children,
  wide = false,
  flush = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
  flush?: boolean;
}) => {
  return (
    <main className="lg:pl-20 bg-light-primary dark:bg-dark-primary min-h-screen">
      <div
        className={
          flush
            ? 'mx-4 max-w-none lg:mx-0'
            : wide
              ? 'mx-2 max-w-[100rem] md:mx-4 lg:mx-auto'
              : 'mx-4 max-w-screen-lg lg:mx-auto'
        }
      >
        {children}
      </div>
    </main>
  );
};

export default Layout;
