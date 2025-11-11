import PropTypes from "prop-types";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";

const links = [{ key: "workflows", label: "Workflows", href: "/" }];

export default function NavBar({ current } = {}) {
  return (
    <AppBar>
      <Toolbar>
        <Typography>agent-flow</Typography>
        {links.map((link) => (
          <Button
            key={link.key}
            component="a"
            href={link.href}
            disabled={current === link.key}
          >
            {link.label}
          </Button>
        ))}
      </Toolbar>
    </AppBar>
  );
}

NavBar.propTypes = {
  current: PropTypes.string,
};
