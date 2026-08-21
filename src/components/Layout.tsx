const Layout = ({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) => {
  return (
    <main className="lg:pl-20 bg-light-primary dark:bg-dark-primary min-h-screen">
      <div
        className={
          wide
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
