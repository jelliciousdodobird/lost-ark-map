// styling:
import { css, jsx, Theme, useTheme } from "@emotion/react";
import styled from "@emotion/styled";

// libraries:
import { AnimatePresence, motion } from "framer-motion";
import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controls } from "./Map2";
// edited in POI branch
// import PointOfInterest, { Poi, PoiTypes } from "./PointOfInterest";
// import { Poi } from "./PointOfInterest";
import { Poi } from "../types/POItypes";

// import rgba from "emotion-rgba";

// icons:
import {
  MdArrowBackIosNew,
  MdArrowBackIos,
  MdArrowBack,
  MdMenuBook,
  MdSearch,
  MdClose,
  MdMenu,
  MdBackHand,
  MdMenuOpen,
} from "react-icons/md";
import ItemPreview from "./ItemPreview";
import Debug from "./Debug";
import { nanoid } from "nanoid";

const Container = styled(motion.div)`
  /* border: 1px solid red; */

  z-index: 100;

  position: absolute;
  top: 0;
  left: 0;

  width: 30rem;
  padding: 1rem;

  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.s}px) {
    width: 100%;
    min-width: 100%;
  }
`;

const SearchbarContainer = styled(motion.div)`
  /* border: 1px solid orange; */

  z-index: 1;
  position: relative;
  background-color: ${({ theme }) => theme.colors.surface.main};

  padding: 0 0.75rem;

  height: 4rem;
  border-radius: 5rem;

  box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;

  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.onSurface.main};

  width: 100%;

  &::placeholder {
    /* color: transparent; */
  }
`;

const Button = styled(motion.button)`
  background-color: transparent;
  /* background-color: red; */

  border-radius: 50%;

  min-width: 3rem;
  min-height: 3rem;

  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    width: 24px;
    height: 24px;

    fill: ${({ theme }) => theme.colors.onSurface.main};
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface.dark};
  }
`;

const Results = styled(motion.ul)`
  z-index: 2;

  /* border: 1px solid blue; */

  background-color: ${({ theme }) => theme.colors.surface.main};
  border-radius: 1rem;

  box-shadow: rgba(100, 100, 111, 0.2) 0px 21px 28px 0px;

  height: fit-content;
  max-height: calc(100vh / 3);
  padding: 0.75rem 0;

  /* border-top: 0.5rem solid ${({ theme }) => theme.colors.surface.main}; */
  /* border-bottom: 0.5rem solid ${({ theme }) => theme.colors.surface.main}; */

  overflow: auto;
  /* HIDE SCROLL BARS BUT STILL SCROLLABLE */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  li:nth-of-type(2n + 1) {
    /* background-color: ${({ theme }) => theme.colors.surface.dark}; */
  }
`;

const NoResult = styled.li`
  padding: 1rem 2rem;
`;

const Placeholder = styled(motion.div)`
  display: flex;
  gap: 0.5rem;
`;

const Key = styled(motion.span)`
  padding: 0.5rem;
  border-radius: 5px;
  /* background-color: ${({ theme }) => theme.colors.surface.darker}; */
  background-color: transparent;
  color: ${({ theme }) => theme.colors.surface.darker};
  /* color: #e6e6e7; */
  border: 1px solid currentColor;
`;

const buttonAnimation = {
  whileTap: { scale: 0.9 },
};

type SearchbarProps = {
  pois: Poi[];
  controls: Controls;
  showSidebar: boolean;
  isDragging: boolean;
  poiIdSelected: string | null;
};

const Searchbar = ({
  pois,
  controls,
  showSidebar,
  isDragging,
  poiIdSelected,
}: SearchbarProps) => {
  const theme = useTheme();
  const {
    toggleSidebar,
    openSidebar,
    closeSidebar,
    panToCenter,
    panToElement,

    resetZoom,
    setPoiIdSelected,
  } = controls;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [shiftHeld, setShiftHeld] = useState(false);
  const [fPressed, setFPressed] = useState(false);
  const [shortcutRegistered, setShortcutRegistered] = useState(false);

  // search states:
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Poi[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fuse = useMemo(
    () =>
      new Fuse(pois, {
        keys: ["id"],
        includeScore: true,
        shouldSort: true,
        threshold: 0.3,
      }),
    [pois]
  );

  // derived state:
  const noResults = searchResults.length === 0;

  const getStyle = (keyHeldState: boolean) => ({
    borderColor: keyHeldState ? theme.colors.primary.main : "currentColor",
  });

  const resultAnimProps = {
    variants: {
      initial: {
        opacity: 0,
        y: -500,
        zIndex: 0,
      },
      enter: {
        opacity: 1,
        y: 0,
        transitionEnd: {
          // after the transition ends put the zIndex back to 2
          // so that the drop shadow of the searchbar is not on top of the current
          zIndex: 2,
        },
      },
    },
    initial: "initial",
    animate: "enter",
    exit: "initial",

    transition: { type: "tween", duration: 0.5 },
  };

  useEffect(() => {
    const checkKeyState = (e: any, value: boolean) => {
      if (e.key.toLowerCase() === "f") setFPressed(value);
      if (e.key.toLowerCase() === "shift") setShiftHeld(value);
    };

    const onKeyDown = (e: any) => checkKeyState(e, true);
    const onKeyUp = (e: any) => checkKeyState(e, false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      if (fPressed && shiftHeld) {
        inputRef.current.focus();
        setShortcutRegistered(true);
      }
    }
  }, [fPressed, shiftHeld]);

  useEffect(() => {
    if (searchTerm !== "") {
      const sr = fuse.search(searchTerm);
      const newResults = sr.map(({ item }) => item);

      setSearchResults(newResults);
    } else setSearchResults([]);
  }, [searchTerm, pois]);

  useEffect(() => {
    setShowResults(searchTerm !== "");
  }, [searchTerm]);

  const determineFocusState = (node: Node | null) => {
    if (containerRef.current) {
      const containerStillHasFocus = containerRef.current.contains(node);
      setShowResults(containerStillHasFocus && searchTerm !== "");
    }
  };

  return (
    <Container
      ref={containerRef}
      animate={{ opacity: isDragging ? 0.6 : 1 }}
      onFocus={(e) => determineFocusState(e.target)}
      onBlur={(e) => determineFocusState(e.relatedTarget)}
    >
      <SearchbarContainer
        animate={{
          scale: shortcutRegistered ? [1, 1.1, 1] : [1, 1, 1],
          transition: { type: "tween", duration: 0.5 },
        }}
        onAnimationComplete={() => setShortcutRegistered(false)}
      >
        <Button type="button" onClick={toggleSidebar} {...buttonAnimation}>
          {showSidebar ? (
            <MdArrowBack />
          ) : (
            <MdMenuOpen style={{ transform: "scaleX(-1)" }} />
          )}
        </Button>
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
        />
        {!searchTerm && (
          <Placeholder>
            <Key style={getStyle(shiftHeld)}>SHIFT</Key>
            <Key style={getStyle(fPressed)}>F</Key>
          </Placeholder>
        )}
        <Button
          type="button"
          onClick={() => {
            if (searchTerm) setSearchTerm("");
            if (inputRef.current) inputRef.current.focus();
          }}
          {...buttonAnimation}
        >
          {searchTerm ? <MdClose /> : <MdSearch />}
        </Button>
      </SearchbarContainer>

      <AnimatePresence>
        {showResults && (
          <Results
            // tabIndex this container be focusable with -1 meaning users cannot tab to the element
            // determineFocusState() depends on this being set
            tabIndex={-1}
            {...resultAnimProps}
          >
            {noResults && <NoResult>No results.</NoResult>}
            {searchResults.map((poi) => (
              <ItemPreview
                key={poi.id}
                poi={poi}
                controls={controls}
                onClick={() => {
                  // set new item:
                  setPoiIdSelected(poi.id);

                  // handle UI state:
                  openSidebar();
                  setShowResults(false);
                  setTimeout(
                    () => panToElement(poi.id, { duration: 0.5 }),
                    showSidebar ? 0 : 500 // we need to wait a little bit before we pan if the sidebar is open
                  );
                }}
              ></ItemPreview>
            ))}
          </Results>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default Searchbar;
