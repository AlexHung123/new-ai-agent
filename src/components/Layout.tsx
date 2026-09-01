import { layoutContentClassName, type LayoutKind } from './layoutWidth';

const Layout = ({
  children,
  kind = 'narrow',
}: {
  children: React.ReactNode;
  kind?: LayoutKind;
}) => {
  return (
    <main
      className={
        kind === 'reader'
          ? 'lg:pl-[72px] bg-light-primary dark:bg-dark-primary min-h-screen'
          : 'lg:pl-20 bg-light-primary dark:bg-dark-primary min-h-screen'
      }
    >
      <div className={layoutContentClassName(kind)}>{children}</div>
    </main>
  );
};

export default Layout;
