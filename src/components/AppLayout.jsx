import {
    AppBar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import { NavLink, Outlet } from "react-router-dom";

import GroupsIcon from "@mui/icons-material/Groups";
import InsightsIcon from "@mui/icons-material/Insights";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import { useAuth } from "../auth/useAuth";
import { useState } from "react";

const DRAWER_WIDTH = 232;

const NAV_ITEMS = [
    { to: "/", label: "Live", icon: MonitorHeartIcon },
    { to: "/predictions", label: "Statistics", icon: InsightsIcon },
    { to: "/fighters", label: "Fighters", icon: GroupsIcon },
    { to: "/matchups", label: "Matchups", icon: SportsMmaIcon },
];

function NavContent({ onNavigate }) {
    return (
        <Box>
            <Toolbar sx={{ px: 3 }}>
                <Typography variant="h6" noWrap>
                    Salt Mines HQ
                </Typography>
            </Toolbar>
            <Divider />
            <List sx={{ px: 1, py: 2 }}>
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <ListItemButton
                        key={to}
                        component={NavLink}
                        to={to}
                        // `end` keeps "/" from matching every nested route.
                        end={to === "/"}
                        onClick={onNavigate}
                        sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            "&.active": {
                                bgcolor: "action.selected",
                                color: "primary.light",
                                "& .MuiListItemIcon-root": {
                                    color: "primary.light",
                                },
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <Icon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary={label}
                            primaryTypographyProps={{ variant: "subtitle2" }}
                        />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );
}

/**
 * Application shell: a permanent nav rail on desktop, a dismissible drawer below
 * the `md` breakpoint.
 */
export function AppLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { username, logOut } = useAuth();

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { md: `${DRAWER_WIDTH}px` },
                    bgcolor: "background.default",
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            >
                <Toolbar>
                    <IconButton
                        edge="start"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation"
                        sx={{ mr: 2, display: { md: "none" } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{ flex: 1 }} />

                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                            variant="body2"
                            sx={{
                                color: "text.secondary",
                                display: { xs: "none", sm: "block" },
                            }}
                        >
                            {username}
                        </Typography>
                        <Tooltip title="Sign out">
                            <IconButton onClick={logOut} aria-label="Sign out">
                                <LogoutIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: "block", md: "none" },
                        "& .MuiDrawer-paper": {
                            width: DRAWER_WIDTH,
                            boxSizing: "border-box",
                        },
                    }}
                >
                    <NavContent onNavigate={() => setMobileOpen(false)} />
                </Drawer>

                <Drawer
                    variant="permanent"
                    open
                    sx={{
                        display: { xs: "none", md: "block" },
                        "& .MuiDrawer-paper": {
                            width: DRAWER_WIDTH,
                            boxSizing: "border-box",
                            bgcolor: "background.default",
                        },
                    }}
                >
                    <NavContent />
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flex: 1,
                    minWidth: 0,
                    px: { xs: 2, md: 3 },
                    pb: 4,
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
}
