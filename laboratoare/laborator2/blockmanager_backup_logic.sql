--
-- PostgreSQL database dump
--

\restrict jdDSaAUEWcI5t916gsWk806PItR2adziJIvS1P8OP0nqaFrUISGAYFfP5d5yPcR

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CodActiune; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CodActiune" AS ENUM (
    'CALCUL',
    'RECALCUL',
    'NOTIFICARI',
    'EXPORT_PDF',
    'RAPORT'
);


--
-- Name: MetodaPlata; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MetodaPlata" AS ENUM (
    'CASIERIE',
    'TRANSFER',
    'CARD'
);


--
-- Name: ModRepartizare; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ModRepartizare" AS ENUM (
    'COTA_PARTE',
    'PERSOANE',
    'CONSUM',
    'APARTAMENT',
    'SUPRAFATA'
);


--
-- Name: Rol; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Rol" AS ENUM (
    'ADMIN',
    'PRESEDINTE',
    'PROPRIETAR'
);


--
-- Name: StatusAbonament; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusAbonament" AS ENUM (
    'ACTIV',
    'SUSPENDAT',
    'ANULAT',
    'EXPIRAT'
);


--
-- Name: StatusComanda; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusComanda" AS ENUM (
    'IN_ASTEPTARE',
    'ACHITATA',
    'ANULATA'
);


--
-- Name: StatusFisa; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusFisa" AS ENUM (
    'NEPLATITA',
    'PARTIAL_PLATITA',
    'PLATITA'
);


--
-- Name: StatusLuna; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusLuna" AS ENUM (
    'DESCHISA',
    'CALCULATA',
    'APROBATA',
    'PUBLICATA',
    'INCHISA'
);


--
-- Name: StatusPlata; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusPlata" AS ENUM (
    'INREGISTRATA',
    'ANULATA'
);


--
-- Name: StatusSesizare; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusSesizare" AS ENUM (
    'NOUA',
    'IN_LUCRU',
    'REZOLVATA'
);


--
-- Name: SursaCitire; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SursaCitire" AS ENUM (
    'PROPRIETAR',
    'ADMIN',
    'ESTIMAT'
);


--
-- Name: TipComanda; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipComanda" AS ENUM (
    'ABONAMENT',
    'PACHET'
);


--
-- Name: TipFond; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipFond" AS ENUM (
    'RULMENT',
    'REPARATII'
);


--
-- Name: TipNotificare; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipNotificare" AS ENUM (
    'INTRETINERE',
    'PLATA',
    'SESIZARE',
    'ABONAMENT',
    'TOKENI',
    'SISTEM'
);


--
-- Name: TipTranzactie; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipTranzactie" AS ENUM (
    'ALOCARE',
    'CONSUM',
    'CUMPARARE',
    'EXPIRARE',
    'BONUS'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: abonamente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.abonamente (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    plan_id integer NOT NULL,
    plan_urmator_id integer,
    inceput_perioada timestamp(3) without time zone NOT NULL,
    sfarsit_perioada timestamp(3) without time zone NOT NULL,
    status public."StatusAbonament" DEFAULT 'ACTIV'::public."StatusAbonament" NOT NULL,
    reinnoire_automata boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: abonamente_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.abonamente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: abonamente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.abonamente_id_seq OWNED BY public.abonamente.id;


--
-- Name: actiuni_taxabile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actiuni_taxabile (
    id integer NOT NULL,
    cod public."CodActiune" NOT NULL,
    denumire text NOT NULL,
    cost_tokeni integer NOT NULL
);


--
-- Name: actiuni_taxabile_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.actiuni_taxabile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: actiuni_taxabile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.actiuni_taxabile_id_seq OWNED BY public.actiuni_taxabile.id;


--
-- Name: alocari_plati; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alocari_plati (
    id integer NOT NULL,
    plata_id integer NOT NULL,
    fisa_id integer NOT NULL,
    suma numeric(12,2) NOT NULL
);


--
-- Name: alocari_plati_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alocari_plati_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alocari_plati_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alocari_plati_id_seq OWNED BY public.alocari_plati.id;


--
-- Name: anunturi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anunturi (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    autor_id integer NOT NULL,
    titlu text NOT NULL,
    continut text NOT NULL,
    important boolean DEFAULT false NOT NULL,
    data_publicare timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: anunturi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.anunturi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: anunturi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.anunturi_id_seq OWNED BY public.anunturi.id;


--
-- Name: apartamente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apartamente (
    id integer NOT NULL,
    scara_id integer NOT NULL,
    numar text NOT NULL,
    etaj integer NOT NULL,
    suprafata_utila numeric(8,2) NOT NULL,
    cota_parte numeric(7,4) NOT NULL,
    nr_persoane integer DEFAULT 1 NOT NULL
);


--
-- Name: apartamente_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.apartamente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: apartamente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.apartamente_id_seq OWNED BY public.apartamente.id;


--
-- Name: asociatii; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asociatii (
    id integer NOT NULL,
    denumire text NOT NULL,
    cui text NOT NULL,
    adresa text NOT NULL,
    iban text NOT NULL,
    banca text,
    zi_limita_citiri integer DEFAULT 20 NOT NULL,
    zile_scadenta integer DEFAULT 20 NOT NULL,
    procent_penalizare_zi numeric(5,3) DEFAULT 0.2 NOT NULL,
    zile_gratie_penalizare integer DEFAULT 30 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: asociatii_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asociatii_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asociatii_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asociatii_id_seq OWNED BY public.asociatii.id;


--
-- Name: blocuri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocuri (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    denumire text NOT NULL,
    adresa text NOT NULL
);


--
-- Name: blocuri_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blocuri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blocuri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blocuri_id_seq OWNED BY public.blocuri.id;


--
-- Name: categorii_cheltuieli; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorii_cheltuieli (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    denumire text NOT NULL,
    mod_repartizare public."ModRepartizare" NOT NULL,
    activa boolean DEFAULT true NOT NULL
);


--
-- Name: categorii_cheltuieli_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorii_cheltuieli_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorii_cheltuieli_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorii_cheltuieli_id_seq OWNED BY public.categorii_cheltuieli.id;


--
-- Name: citiri_contoare; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.citiri_contoare (
    id integer NOT NULL,
    contor_id integer NOT NULL,
    luna_id integer NOT NULL,
    introdus_de_id integer,
    index numeric(12,3) NOT NULL,
    consum numeric(12,3) NOT NULL,
    data_citire timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sursa public."SursaCitire" DEFAULT 'PROPRIETAR'::public."SursaCitire" NOT NULL,
    validata boolean DEFAULT false NOT NULL
);


--
-- Name: citiri_contoare_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.citiri_contoare_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: citiri_contoare_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.citiri_contoare_id_seq OWNED BY public.citiri_contoare.id;


--
-- Name: comenzi_simulate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comenzi_simulate (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    utilizator_id integer,
    abonament_id integer,
    tip public."TipComanda" NOT NULL,
    plan_id integer,
    pachet_id integer,
    suma numeric(10,2) NOT NULL,
    status public."StatusComanda" DEFAULT 'IN_ASTEPTARE'::public."StatusComanda" NOT NULL,
    referinta text NOT NULL,
    achitata_la timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: comenzi_simulate_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comenzi_simulate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comenzi_simulate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comenzi_simulate_id_seq OWNED BY public.comenzi_simulate.id;


--
-- Name: contoare; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contoare (
    id integer NOT NULL,
    apartament_id integer NOT NULL,
    serie text NOT NULL,
    data_verificare_metrologica date,
    activ boolean DEFAULT true NOT NULL
);


--
-- Name: contoare_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contoare_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contoare_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contoare_id_seq OWNED BY public.contoare.id;


--
-- Name: detalii_intretinere; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalii_intretinere (
    id integer NOT NULL,
    fisa_id integer NOT NULL,
    categorie_id integer NOT NULL,
    baza_calcul numeric(12,4) NOT NULL,
    suma numeric(12,2) NOT NULL
);


--
-- Name: detalii_intretinere_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detalii_intretinere_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalii_intretinere_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detalii_intretinere_id_seq OWNED BY public.detalii_intretinere.id;


--
-- Name: facturi_furnizori; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturi_furnizori (
    id integer NOT NULL,
    furnizor_id integer NOT NULL,
    luna_id integer NOT NULL,
    categorie_id integer NOT NULL,
    numar text NOT NULL,
    data_emitere date NOT NULL,
    data_scadenta date NOT NULL,
    suma numeric(12,2) NOT NULL,
    cantitate numeric(12,3),
    platita boolean DEFAULT false NOT NULL,
    fisier_url text
);


--
-- Name: facturi_furnizori_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.facturi_furnizori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: facturi_furnizori_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.facturi_furnizori_id_seq OWNED BY public.facturi_furnizori.id;


--
-- Name: fise_intretinere; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fise_intretinere (
    id integer NOT NULL,
    luna_id integer NOT NULL,
    apartament_id integer NOT NULL,
    total_luna_curenta numeric(12,2) NOT NULL,
    restanta_anterioara numeric(12,2) DEFAULT 0 NOT NULL,
    penalizari numeric(12,2) DEFAULT 0 NOT NULL,
    total_de_plata numeric(12,2) NOT NULL,
    achitat numeric(12,2) DEFAULT 0 NOT NULL,
    status public."StatusFisa" DEFAULT 'NEPLATITA'::public."StatusFisa" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: fise_intretinere_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fise_intretinere_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fise_intretinere_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fise_intretinere_id_seq OWNED BY public.fise_intretinere.id;


--
-- Name: fonduri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fonduri (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    tip public."TipFond" NOT NULL,
    sold numeric(12,2) DEFAULT 0 NOT NULL,
    contributie_lunara numeric(10,2) DEFAULT 0 NOT NULL
);


--
-- Name: fonduri_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fonduri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fonduri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fonduri_id_seq OWNED BY public.fonduri.id;


--
-- Name: furnizori; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.furnizori (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    denumire text NOT NULL,
    cui text NOT NULL,
    iban text
);


--
-- Name: furnizori_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.furnizori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: furnizori_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.furnizori_id_seq OWNED BY public.furnizori.id;


--
-- Name: luni_intretinere; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.luni_intretinere (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    an integer NOT NULL,
    luna integer NOT NULL,
    status public."StatusLuna" DEFAULT 'DESCHISA'::public."StatusLuna" NOT NULL,
    data_limita_citiri date NOT NULL,
    data_publicare timestamp(3) without time zone,
    data_scadenta date,
    aprobat_de_id integer
);


--
-- Name: luni_intretinere_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.luni_intretinere_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: luni_intretinere_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.luni_intretinere_id_seq OWNED BY public.luni_intretinere.id;


--
-- Name: notificari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificari (
    id integer NOT NULL,
    utilizator_id integer NOT NULL,
    tip public."TipNotificare" NOT NULL,
    mesaj text NOT NULL,
    citita boolean DEFAULT false NOT NULL,
    data_creare timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notificari_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificari_id_seq OWNED BY public.notificari.id;


--
-- Name: pachete_tokeni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pachete_tokeni (
    id integer NOT NULL,
    denumire text NOT NULL,
    tokeni integer NOT NULL,
    pret numeric(10,2) NOT NULL,
    activ boolean DEFAULT true NOT NULL
);


--
-- Name: pachete_tokeni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pachete_tokeni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pachete_tokeni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pachete_tokeni_id_seq OWNED BY public.pachete_tokeni.id;


--
-- Name: penalizari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.penalizari (
    id integer NOT NULL,
    fisa_id integer NOT NULL,
    data_calcul date NOT NULL,
    zile_intarziere integer NOT NULL,
    suma numeric(10,2) NOT NULL
);


--
-- Name: penalizari_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.penalizari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: penalizari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.penalizari_id_seq OWNED BY public.penalizari.id;


--
-- Name: planuri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planuri (
    id integer NOT NULL,
    cod text NOT NULL,
    denumire text NOT NULL,
    pret_lunar numeric(10,2) NOT NULL,
    tokeni_lunari integer NOT NULL,
    max_apartamente integer,
    max_blocuri integer,
    raport_anual boolean DEFAULT false NOT NULL,
    activ boolean DEFAULT true NOT NULL
);


--
-- Name: planuri_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planuri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: planuri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planuri_id_seq OWNED BY public.planuri.id;


--
-- Name: plati; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plati (
    id integer NOT NULL,
    apartament_id integer NOT NULL,
    platitor_id integer,
    inregistrat_de_id integer,
    suma numeric(12,2) NOT NULL,
    data_plata timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metoda public."MetodaPlata" NOT NULL,
    numar_chitanta text NOT NULL,
    status public."StatusPlata" DEFAULT 'INREGISTRATA'::public."StatusPlata" NOT NULL
);


--
-- Name: plati_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plati_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plati_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plati_id_seq OWNED BY public.plati.id;


--
-- Name: portofele_tokeni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portofele_tokeni (
    id integer NOT NULL,
    asociatie_id integer NOT NULL,
    tokeni_plan integer DEFAULT 0 NOT NULL,
    tokeni_extra integer DEFAULT 0 NOT NULL,
    ultima_resetare timestamp(3) without time zone,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: portofele_tokeni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portofele_tokeni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portofele_tokeni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portofele_tokeni_id_seq OWNED BY public.portofele_tokeni.id;


--
-- Name: proprietati; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proprietati (
    id integer NOT NULL,
    apartament_id integer NOT NULL,
    utilizator_id integer NOT NULL,
    procent_detinere numeric(5,2) DEFAULT 100 NOT NULL,
    data_inceput date NOT NULL,
    data_sfarsit date
);


--
-- Name: proprietati_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proprietati_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proprietati_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proprietati_id_seq OWNED BY public.proprietati.id;


--
-- Name: scari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scari (
    id integer NOT NULL,
    bloc_id integer NOT NULL,
    denumire text NOT NULL
);


--
-- Name: scari_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scari_id_seq OWNED BY public.scari.id;


--
-- Name: sesizari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sesizari (
    id integer NOT NULL,
    apartament_id integer NOT NULL,
    autor_id integer NOT NULL,
    titlu text NOT NULL,
    descriere text NOT NULL,
    status public."StatusSesizare" DEFAULT 'NOUA'::public."StatusSesizare" NOT NULL,
    raspuns text,
    data_creare timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_rezolvare timestamp(3) without time zone
);


--
-- Name: sesizari_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sesizari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sesizari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sesizari_id_seq OWNED BY public.sesizari.id;


--
-- Name: tranzactii_tokeni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tranzactii_tokeni (
    id integer NOT NULL,
    portofel_id integer NOT NULL,
    tip public."TipTranzactie" NOT NULL,
    cantitate integer NOT NULL,
    sold_dupa integer NOT NULL,
    actiune_id integer,
    comanda_id integer,
    utilizator_id integer,
    descriere text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tranzactii_tokeni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tranzactii_tokeni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tranzactii_tokeni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tranzactii_tokeni_id_seq OWNED BY public.tranzactii_tokeni.id;


--
-- Name: utilizatori; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilizatori (
    id integer NOT NULL,
    asociatie_id integer,
    email text NOT NULL,
    parola_hash text NOT NULL,
    nume text NOT NULL,
    prenume text NOT NULL,
    telefon text,
    rol public."Rol" DEFAULT 'PROPRIETAR'::public."Rol" NOT NULL,
    activ boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: utilizatori_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.utilizatori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utilizatori_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.utilizatori_id_seq OWNED BY public.utilizatori.id;


--
-- Name: abonamente id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonamente ALTER COLUMN id SET DEFAULT nextval('public.abonamente_id_seq'::regclass);


--
-- Name: actiuni_taxabile id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actiuni_taxabile ALTER COLUMN id SET DEFAULT nextval('public.actiuni_taxabile_id_seq'::regclass);


--
-- Name: alocari_plati id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alocari_plati ALTER COLUMN id SET DEFAULT nextval('public.alocari_plati_id_seq'::regclass);


--
-- Name: anunturi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anunturi ALTER COLUMN id SET DEFAULT nextval('public.anunturi_id_seq'::regclass);


--
-- Name: apartamente id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apartamente ALTER COLUMN id SET DEFAULT nextval('public.apartamente_id_seq'::regclass);


--
-- Name: asociatii id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asociatii ALTER COLUMN id SET DEFAULT nextval('public.asociatii_id_seq'::regclass);


--
-- Name: blocuri id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocuri ALTER COLUMN id SET DEFAULT nextval('public.blocuri_id_seq'::regclass);


--
-- Name: categorii_cheltuieli id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorii_cheltuieli ALTER COLUMN id SET DEFAULT nextval('public.categorii_cheltuieli_id_seq'::regclass);


--
-- Name: citiri_contoare id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citiri_contoare ALTER COLUMN id SET DEFAULT nextval('public.citiri_contoare_id_seq'::regclass);


--
-- Name: comenzi_simulate id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comenzi_simulate ALTER COLUMN id SET DEFAULT nextval('public.comenzi_simulate_id_seq'::regclass);


--
-- Name: contoare id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contoare ALTER COLUMN id SET DEFAULT nextval('public.contoare_id_seq'::regclass);


--
-- Name: detalii_intretinere id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalii_intretinere ALTER COLUMN id SET DEFAULT nextval('public.detalii_intretinere_id_seq'::regclass);


--
-- Name: facturi_furnizori id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturi_furnizori ALTER COLUMN id SET DEFAULT nextval('public.facturi_furnizori_id_seq'::regclass);


--
-- Name: fise_intretinere id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fise_intretinere ALTER COLUMN id SET DEFAULT nextval('public.fise_intretinere_id_seq'::regclass);


--
-- Name: fonduri id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fonduri ALTER COLUMN id SET DEFAULT nextval('public.fonduri_id_seq'::regclass);


--
-- Name: furnizori id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.furnizori ALTER COLUMN id SET DEFAULT nextval('public.furnizori_id_seq'::regclass);


--
-- Name: luni_intretinere id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.luni_intretinere ALTER COLUMN id SET DEFAULT nextval('public.luni_intretinere_id_seq'::regclass);


--
-- Name: notificari id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificari ALTER COLUMN id SET DEFAULT nextval('public.notificari_id_seq'::regclass);


--
-- Name: pachete_tokeni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pachete_tokeni ALTER COLUMN id SET DEFAULT nextval('public.pachete_tokeni_id_seq'::regclass);


--
-- Name: penalizari id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalizari ALTER COLUMN id SET DEFAULT nextval('public.penalizari_id_seq'::regclass);


--
-- Name: planuri id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planuri ALTER COLUMN id SET DEFAULT nextval('public.planuri_id_seq'::regclass);


--
-- Name: plati id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plati ALTER COLUMN id SET DEFAULT nextval('public.plati_id_seq'::regclass);


--
-- Name: portofele_tokeni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portofele_tokeni ALTER COLUMN id SET DEFAULT nextval('public.portofele_tokeni_id_seq'::regclass);


--
-- Name: proprietati id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proprietati ALTER COLUMN id SET DEFAULT nextval('public.proprietati_id_seq'::regclass);


--
-- Name: scari id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scari ALTER COLUMN id SET DEFAULT nextval('public.scari_id_seq'::regclass);


--
-- Name: sesizari id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesizari ALTER COLUMN id SET DEFAULT nextval('public.sesizari_id_seq'::regclass);


--
-- Name: tranzactii_tokeni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tranzactii_tokeni ALTER COLUMN id SET DEFAULT nextval('public.tranzactii_tokeni_id_seq'::regclass);


--
-- Name: utilizatori id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilizatori ALTER COLUMN id SET DEFAULT nextval('public.utilizatori_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f1c994dd-08d5-47e0-96de-a0dde0f919bb	9806ac1fc6d0028a36244831d72c6fba14acf3bcd90b36b997f707a81bee121a	2026-10-23 16:05:04.868648+00	20261023120000_init	\N	\N	2026-10-23 16:05:04.188338+00	1
\.


--
-- Data for Name: abonamente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.abonamente (id, asociatie_id, plan_id, plan_urmator_id, inceput_perioada, sfarsit_perioada, status, reinnoire_automata, created_at) FROM stdin;
1	1	1	\N	2026-07-05 10:00:00	2026-08-05 10:00:00	EXPIRAT	t	2026-07-05 10:00:00
2	1	2	\N	2026-10-06 10:00:00	2026-11-06 10:00:00	ACTIV	t	2026-08-05 10:00:00
3	2	1	\N	2026-10-01 10:00:00	2026-11-01 10:00:00	ACTIV	t	2026-09-01 10:00:00
4	3	3	\N	2026-09-20 10:00:00	2026-10-20 10:00:00	SUSPENDAT	t	2026-09-20 10:00:00
\.


--
-- Data for Name: actiuni_taxabile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.actiuni_taxabile (id, cod, denumire, cost_tokeni) FROM stdin;
1	CALCUL	Calcul întreținere lunară	10
2	RECALCUL	Recalculare întreținere	5
3	NOTIFICARI	Trimitere notificări lunare către proprietari	5
4	EXPORT_PDF	Export PDF listă de plată	2
5	RAPORT	Raport anual de încasări	15
\.


--
-- Data for Name: alocari_plati; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alocari_plati (id, plata_id, fisa_id, suma) FROM stdin;
1	1	1	100.53
2	2	2	101.51
3	3	3	166.49
4	4	4	52.86
5	5	5	145.58
6	6	6	83.48
7	7	7	148.46
8	8	8	87.69
9	9	10	128.55
10	10	11	130.43
11	11	12	132.76
12	12	14	110.52
13	13	15	112.40
14	14	16	114.74
15	15	18	109.86
\.


--
-- Data for Name: anunturi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.anunturi (id, asociatie_id, autor_id, titlu, continut, important, data_publicare) FROM stdin;
1	1	1	Lista de plată pe octombrie a fost publicată	Lista de plată pentru octombrie 2026 este disponibilă în aplicație. Termenul de plată este 15 noiembrie.	t	2026-10-22 10:00:00
2	1	1	Revizie lift scara B	Joi, 29 octombrie, între 9:00 și 12:00, liftul de la scara B va fi oprit pentru revizie.	f	2026-10-20 10:00:00
3	3	25	Ședința anuală a asociației	Ședința anuală va avea loc pe 5 noiembrie la ora 18:00, la sediul administrației.	f	2026-10-15 10:00:00
\.


--
-- Data for Name: apartamente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.apartamente (id, scara_id, numar, etaj, suprafata_utila, cota_parte, nr_persoane) FROM stdin;
1	1	1	0	64.10	7.0750	3
2	1	2	0	38.70	4.2715	1
3	1	3	0	71.30	7.8698	4
4	1	4	0	52.40	5.7837	2
5	1	5	1	64.10	7.0750	3
6	1	6	1	38.70	4.2715	1
7	1	7	1	71.30	7.8698	4
8	1	8	1	52.40	5.7837	2
9	2	1	0	64.10	7.0750	3
10	2	2	0	38.70	4.2715	1
11	2	3	0	71.30	7.8698	4
12	2	4	0	52.40	5.7837	2
13	2	5	1	64.10	7.0750	3
14	2	6	1	38.70	4.2715	1
15	2	7	1	71.30	7.8698	4
16	2	8	1	52.40	5.7837	2
17	3	1	0	64.10	19.4655	3
18	3	2	0	38.70	11.7522	1
19	3	3	0	71.30	21.6520	4
20	3	4	0	52.40	15.9126	2
21	3	5	1	64.10	19.4655	3
22	3	6	1	38.70	11.7522	1
23	4	1	0	64.10	5.1890	3
24	4	2	0	38.70	3.1329	1
25	4	3	0	71.30	5.7719	4
26	4	4	0	52.40	4.2419	2
27	4	5	1	64.10	5.1890	3
28	4	6	1	38.70	3.1329	1
29	4	7	1	71.30	5.7719	4
30	4	8	1	52.40	4.2419	2
31	5	1	0	64.10	5.1890	3
32	5	2	0	38.70	3.1328	1
33	5	3	0	71.30	5.7719	4
34	5	4	0	52.40	4.2419	2
35	5	5	1	64.10	5.1890	3
36	5	6	1	38.70	3.1328	1
37	5	7	1	71.30	5.7719	4
38	5	8	1	52.40	4.2419	2
39	6	1	0	64.10	5.1890	3
40	6	2	0	38.70	3.1328	1
41	6	3	0	71.30	5.7719	4
42	6	4	0	52.40	4.2419	2
43	6	5	1	64.10	5.1890	3
44	6	6	1	38.70	3.1328	1
\.


--
-- Data for Name: asociatii; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asociatii (id, denumire, cui, adresa, iban, banca, zi_limita_citiri, zile_scadenta, procent_penalizare_zi, zile_gratie_penalizare, created_at) FROM stdin;
1	Asociația de Proprietari Florilor 12	RO90000001	Str. Florilor nr. 12, Iași	RO49TEST0000000000000001	Banca Test	20	20	0.200	30	2026-10-23 16:05:15.782
2	Asociația Locatarilor Parcul Verde	RO90000002	Bd. Parcului nr. 3, Cluj-Napoca	RO49TEST0000000000000002	Banca Test	20	20	0.200	30	2026-10-23 16:05:15.917
3	Asociația de Proprietari Mărăști 7	RO90000003	Bd. Mărăști nr. 7, București	RO49TEST0000000000000003	Banca Test	20	20	0.200	30	2026-10-23 16:05:15.957
\.


--
-- Data for Name: blocuri; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blocuri (id, asociatie_id, denumire, adresa) FROM stdin;
1	1	Bloc F12	Str. Florilor nr. 12, Iași
2	2	Bloc P3	Bd. Parcului nr. 3, Cluj-Napoca
3	3	Bloc M7	Bd. Mărăști nr. 7, București
4	3	Bloc M7 bis	Bd. Mărăști nr. 7, București
\.


--
-- Data for Name: categorii_cheltuieli; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorii_cheltuieli (id, asociatie_id, denumire, mod_repartizare, activa) FROM stdin;
1	1	Apă	CONSUM	t
2	1	Salubritate	PERSOANE	t
3	1	Întreținere lift	APARTAMENT	t
4	1	Energie electrică părți comune	COTA_PARTE	t
\.


--
-- Data for Name: citiri_contoare; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.citiri_contoare (id, contor_id, luna_id, introdus_de_id, index, consum, data_citire, sursa, validata) FROM stdin;
1	1	1	2	104.000	4.000	2026-09-18 10:00:00	PROPRIETAR	t
2	1	2	2	107.000	3.000	2026-10-17 10:00:00	PROPRIETAR	t
3	2	1	3	144.000	7.000	2026-09-18 10:00:00	PROPRIETAR	t
4	2	2	3	152.000	8.000	2026-10-17 10:00:00	PROPRIETAR	t
5	3	1	4	184.000	10.000	2026-09-18 10:00:00	PROPRIETAR	t
6	3	2	4	189.000	5.000	2026-10-17 10:00:00	PROPRIETAR	t
7	4	1	5	217.000	6.000	2026-09-18 10:00:00	PROPRIETAR	t
8	4	2	5	227.000	10.000	2026-10-17 10:00:00	PROPRIETAR	t
9	5	1	6	257.000	9.000	2026-09-18 10:00:00	PROPRIETAR	t
10	5	2	6	264.000	7.000	2026-10-17 10:00:00	PROPRIETAR	t
11	6	1	7	290.000	5.000	2026-09-18 10:00:00	PROPRIETAR	t
12	6	2	1	294.000	4.000	2026-10-17 10:00:00	ADMIN	t
13	7	1	8	330.000	8.000	2026-09-18 10:00:00	PROPRIETAR	t
14	7	2	8	339.000	9.000	2026-10-17 10:00:00	PROPRIETAR	t
15	8	1	9	363.000	4.000	2026-09-18 10:00:00	PROPRIETAR	t
16	8	2	9	369.000	6.000	2026-10-17 10:00:00	PROPRIETAR	t
17	9	1	10	403.000	7.000	2026-09-18 10:00:00	PROPRIETAR	t
18	9	2	10	406.000	3.000	2026-10-17 10:00:00	PROPRIETAR	t
19	10	1	11	443.000	10.000	2026-09-18 10:00:00	PROPRIETAR	t
20	10	2	11	451.000	8.000	2026-10-17 10:00:00	PROPRIETAR	t
21	11	1	12	476.000	6.000	2026-09-18 10:00:00	PROPRIETAR	t
22	11	2	12	481.000	5.000	2026-10-17 10:00:00	PROPRIETAR	t
23	12	1	13	516.000	9.000	2026-09-18 10:00:00	PROPRIETAR	t
24	12	2	13	526.000	10.000	2026-10-17 10:00:00	PROPRIETAR	t
25	13	1	14	549.000	5.000	2026-09-18 10:00:00	PROPRIETAR	t
26	13	2	14	556.000	7.000	2026-10-17 10:00:00	PROPRIETAR	t
27	14	1	15	589.000	8.000	2026-09-18 10:00:00	PROPRIETAR	t
28	14	2	15	593.000	4.000	2026-10-17 10:00:00	PROPRIETAR	t
29	15	1	16	622.000	4.000	2026-09-18 10:00:00	PROPRIETAR	t
30	15	2	16	631.000	9.000	2026-10-17 10:00:00	PROPRIETAR	t
31	16	1	17	662.000	7.000	2026-09-18 10:00:00	PROPRIETAR	t
32	16	2	17	668.000	6.000	2026-10-17 10:00:00	PROPRIETAR	t
33	17	3	19	250.000	5.000	2026-10-19 10:00:00	PROPRIETAR	f
34	18	3	20	271.000	6.000	2026-10-19 10:00:00	PROPRIETAR	f
35	19	3	21	292.000	7.000	2026-10-19 10:00:00	PROPRIETAR	f
36	20	3	22	313.000	8.000	2026-10-19 10:00:00	PROPRIETAR	f
\.


--
-- Data for Name: comenzi_simulate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comenzi_simulate (id, asociatie_id, utilizator_id, abonament_id, tip, plan_id, pachet_id, suma, status, referinta, achitata_la, created_at) FROM stdin;
1	1	1	2	ABONAMENT	2	\N	49.00	ACHITATA	SIM-2026-000001	2026-08-05 10:00:00	2026-08-05 10:00:00
2	1	1	2	ABONAMENT	2	\N	49.00	ACHITATA	SIM-2026-000002	2026-09-05 10:00:00	2026-09-05 10:00:00
3	1	\N	2	ABONAMENT	2	\N	49.00	ACHITATA	SIM-2026-000003	2026-10-06 10:00:00	2026-10-05 10:00:00
4	1	1	\N	PACHET	\N	1	19.00	ACHITATA	SIM-2026-000004	2026-10-10 10:00:00	2026-10-10 10:00:00
5	3	25	4	ABONAMENT	3	\N	149.00	ACHITATA	SIM-2026-000005	2026-09-20 10:00:00	2026-09-20 10:00:00
6	3	\N	4	ABONAMENT	3	\N	149.00	IN_ASTEPTARE	SIM-2026-000006	\N	2026-10-20 10:00:00
\.


--
-- Data for Name: contoare; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contoare (id, apartament_id, serie, data_verificare_metrologica, activ) FROM stdin;
1	1	AP-10001	2025-03-15	t
2	2	AP-10002	2025-03-15	t
3	3	AP-10003	2025-03-15	t
4	4	AP-10004	2025-03-15	t
5	5	AP-10005	2025-03-15	t
6	6	AP-10006	2025-03-15	t
7	7	AP-10007	2025-03-15	t
8	8	AP-10008	2025-03-15	t
9	9	AP-10009	2025-03-15	t
10	10	AP-10010	2025-03-15	t
11	11	AP-10011	2025-03-15	t
12	12	AP-10012	2025-03-15	t
13	13	AP-10013	2025-03-15	t
14	14	AP-10014	2025-03-15	t
15	15	AP-10015	2025-03-15	t
16	16	AP-10016	2025-03-15	t
17	17	AP-20001	2025-03-15	t
18	18	AP-20002	2025-03-15	t
19	19	AP-20003	2025-03-15	t
20	20	AP-20004	2025-03-15	t
21	21	AP-20005	2025-03-15	t
22	22	AP-20006	2025-03-15	t
23	23	AP-30001	2025-03-15	t
24	24	AP-30002	2025-03-15	t
25	25	AP-30003	2025-03-15	t
26	26	AP-30004	2025-03-15	t
27	27	AP-30005	2025-03-15	t
28	28	AP-30006	2025-03-15	t
29	29	AP-30007	2025-03-15	t
30	30	AP-30008	2025-03-15	t
31	31	AP-30009	2025-03-15	t
32	32	AP-30010	2025-03-15	t
33	33	AP-30011	2025-03-15	t
34	34	AP-30012	2025-03-15	t
35	35	AP-30013	2025-03-15	t
36	36	AP-30014	2025-03-15	t
37	37	AP-30015	2025-03-15	t
38	38	AP-30016	2025-03-15	t
39	39	AP-30017	2025-03-15	t
40	40	AP-30018	2025-03-15	t
41	41	AP-30019	2025-03-15	t
42	42	AP-30020	2025-03-15	t
43	43	AP-30021	2025-03-15	t
44	44	AP-30022	2025-03-15	t
\.


--
-- Data for Name: detalii_intretinere; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detalii_intretinere (id, fisa_id, categorie_id, baza_calcul, suma) FROM stdin;
1	1	1	4.0000	36.06
2	2	1	7.0000	63.10
3	3	1	10.0000	90.14
4	4	1	6.0000	54.08
5	5	1	9.0000	81.12
6	6	1	5.0000	45.07
7	7	1	8.0000	72.11
8	8	1	4.0000	36.05
9	9	1	7.0000	63.10
10	10	1	10.0000	90.14
11	11	1	6.0000	54.08
12	12	1	9.0000	81.12
13	13	1	5.0000	45.07
14	14	1	8.0000	72.11
15	15	1	4.0000	36.05
16	16	1	7.0000	63.10
17	1	2	3.0000	31.20
18	2	2	1.0000	10.40
19	3	2	4.0000	41.60
20	4	2	2.0000	20.80
21	5	2	3.0000	31.20
22	6	2	1.0000	10.40
23	7	2	4.0000	41.60
24	8	2	2.0000	20.80
25	9	2	3.0000	31.20
26	10	2	1.0000	10.40
27	11	2	4.0000	41.60
28	12	2	2.0000	20.80
29	13	2	3.0000	31.20
30	14	2	1.0000	10.40
31	15	2	4.0000	41.60
32	16	2	2.0000	20.80
33	1	3	1.0000	20.00
34	2	3	1.0000	20.00
35	3	3	1.0000	20.00
36	4	3	1.0000	20.00
37	5	3	1.0000	20.00
38	6	3	1.0000	20.00
39	7	3	1.0000	20.00
40	8	3	1.0000	20.00
41	9	3	1.0000	20.00
42	10	3	1.0000	20.00
43	11	3	1.0000	20.00
44	12	3	1.0000	20.00
45	13	3	1.0000	20.00
46	14	3	1.0000	20.00
47	15	3	1.0000	20.00
48	16	3	1.0000	20.00
49	1	4	7.0750	13.27
50	2	4	4.2715	8.01
51	3	4	7.8698	14.75
52	4	4	5.7837	10.84
53	5	4	7.0750	13.26
54	6	4	4.2715	8.01
55	7	4	7.8698	14.75
56	8	4	5.7837	10.84
57	9	4	7.0750	13.26
58	10	4	4.2715	8.01
59	11	4	7.8698	14.75
60	12	4	5.7837	10.84
61	13	4	7.0750	13.26
62	14	4	4.2715	8.01
63	15	4	7.8698	14.75
64	16	4	5.7837	10.84
65	17	1	3.0000	26.37
66	18	1	8.0000	70.33
67	19	1	5.0000	43.96
68	20	1	10.0000	87.91
69	21	1	7.0000	61.54
70	22	1	4.0000	35.17
71	23	1	9.0000	79.12
72	24	1	6.0000	52.75
73	25	1	3.0000	26.37
74	26	1	8.0000	70.33
75	27	1	5.0000	43.96
76	28	1	10.0000	87.91
77	29	1	7.0000	61.54
78	30	1	4.0000	35.17
79	31	1	9.0000	79.12
80	32	1	6.0000	52.75
81	17	2	3.0000	31.20
82	18	2	1.0000	10.40
83	19	2	4.0000	41.60
84	20	2	2.0000	20.80
85	21	2	3.0000	31.20
86	22	2	1.0000	10.40
87	23	2	4.0000	41.60
88	24	2	2.0000	20.80
89	25	2	3.0000	31.20
90	26	2	1.0000	10.40
91	27	2	4.0000	41.60
92	28	2	2.0000	20.80
93	29	2	3.0000	31.20
94	30	2	1.0000	10.40
95	31	2	4.0000	41.60
96	32	2	2.0000	20.80
97	17	3	1.0000	20.00
98	18	3	1.0000	20.00
99	19	3	1.0000	20.00
100	20	3	1.0000	20.00
101	21	3	1.0000	20.00
102	22	3	1.0000	20.00
103	23	3	1.0000	20.00
104	24	3	1.0000	20.00
105	25	3	1.0000	20.00
106	26	3	1.0000	20.00
107	27	3	1.0000	20.00
108	28	3	1.0000	20.00
109	29	3	1.0000	20.00
110	30	3	1.0000	20.00
111	31	3	1.0000	20.00
112	32	3	1.0000	20.00
113	17	4	7.0750	15.13
114	18	4	4.2715	9.13
115	19	4	7.8698	16.83
116	20	4	5.7837	12.36
117	21	4	7.0750	15.13
118	22	4	4.2715	9.13
119	23	4	7.8698	16.83
120	24	4	5.7837	12.36
121	25	4	7.0750	15.13
122	26	4	4.2715	9.13
123	27	4	7.8698	16.83
124	28	4	5.7837	12.36
125	29	4	7.0750	15.13
126	30	4	4.2715	9.13
127	31	4	7.8698	16.83
128	32	4	5.7837	12.36
\.


--
-- Data for Name: facturi_furnizori; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.facturi_furnizori (id, furnizor_id, luna_id, categorie_id, numar, data_emitere, data_scadenta, suma, cantitate, platita, fisier_url) FROM stdin;
1	1	1	1	F-2609-1	2026-09-10	2026-10-10	982.50	105.000	t	\N
2	2	1	2	F-2609-2	2026-09-10	2026-10-10	416.00	\N	t	\N
3	3	1	3	F-2609-3	2026-09-10	2026-10-10	320.00	\N	t	\N
4	4	1	4	F-2609-4	2026-09-10	2026-10-10	187.45	310.000	t	\N
5	1	2	1	F-2610-1	2026-10-10	2026-11-10	914.30	105.000	f	\N
6	2	2	2	F-2610-2	2026-10-10	2026-11-10	416.00	\N	f	\N
7	3	2	3	F-2610-3	2026-10-10	2026-11-10	320.00	\N	f	\N
8	4	2	4	F-2610-4	2026-10-10	2026-11-10	213.80	310.000	f	\N
\.


--
-- Data for Name: fise_intretinere; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fise_intretinere (id, luna_id, apartament_id, total_luna_curenta, restanta_anterioara, penalizari, total_de_plata, achitat, status, created_at) FROM stdin;
1	1	1	100.53	0.00	0.00	100.53	100.53	PLATITA	2026-09-23 10:00:00
2	1	2	101.51	0.00	0.00	101.51	101.51	PLATITA	2026-09-23 10:00:00
3	1	3	166.49	0.00	0.00	166.49	166.49	PLATITA	2026-09-23 10:00:00
4	1	4	105.72	0.00	0.00	105.72	52.86	PARTIAL_PLATITA	2026-09-23 10:00:00
5	1	5	145.58	0.00	0.00	145.58	145.58	PLATITA	2026-09-23 10:00:00
6	1	6	83.48	0.00	0.00	83.48	83.48	PLATITA	2026-09-23 10:00:00
7	1	7	148.46	0.00	0.00	148.46	148.46	PLATITA	2026-09-23 10:00:00
8	1	8	87.69	0.00	0.00	87.69	87.69	PLATITA	2026-09-23 10:00:00
9	1	9	127.56	0.00	0.00	127.56	0.00	NEPLATITA	2026-09-23 10:00:00
10	1	10	128.55	0.00	0.00	128.55	128.55	PLATITA	2026-09-23 10:00:00
11	1	11	130.43	0.00	0.00	130.43	130.43	PLATITA	2026-09-23 10:00:00
12	1	12	132.76	0.00	0.00	132.76	132.76	PLATITA	2026-09-23 10:00:00
13	1	13	109.53	0.00	0.00	109.53	0.00	NEPLATITA	2026-09-23 10:00:00
14	1	14	110.52	0.00	0.00	110.52	110.52	PLATITA	2026-09-23 10:00:00
15	1	15	112.40	0.00	0.00	112.40	112.40	PLATITA	2026-09-23 10:00:00
16	1	16	114.74	0.00	0.00	114.74	114.74	PLATITA	2026-09-23 10:00:00
17	2	1	92.70	0.00	0.00	92.70	0.00	NEPLATITA	2026-10-21 10:00:00
19	2	3	122.39	0.00	0.00	122.39	0.00	NEPLATITA	2026-10-21 10:00:00
20	2	4	141.07	52.86	0.00	193.93	0.00	NEPLATITA	2026-10-21 10:00:00
21	2	5	127.87	0.00	0.00	127.87	0.00	NEPLATITA	2026-10-21 10:00:00
22	2	6	74.70	0.00	0.00	74.70	0.00	NEPLATITA	2026-10-21 10:00:00
23	2	7	157.55	0.00	0.00	157.55	0.00	NEPLATITA	2026-10-21 10:00:00
24	2	8	105.91	0.00	0.00	105.91	0.00	NEPLATITA	2026-10-21 10:00:00
25	2	9	92.70	127.56	0.00	220.26	0.00	NEPLATITA	2026-10-21 10:00:00
26	2	10	109.86	0.00	0.00	109.86	0.00	NEPLATITA	2026-10-21 10:00:00
27	2	11	122.39	0.00	0.00	122.39	0.00	NEPLATITA	2026-10-21 10:00:00
28	2	12	141.07	0.00	0.00	141.07	0.00	NEPLATITA	2026-10-21 10:00:00
29	2	13	127.87	109.53	0.00	237.40	0.00	NEPLATITA	2026-10-21 10:00:00
30	2	14	74.70	0.00	0.00	74.70	0.00	NEPLATITA	2026-10-21 10:00:00
31	2	15	157.55	0.00	0.00	157.55	0.00	NEPLATITA	2026-10-21 10:00:00
32	2	16	105.91	0.00	0.00	105.91	0.00	NEPLATITA	2026-10-21 10:00:00
18	2	2	109.86	0.00	0.00	109.86	109.86	PLATITA	2026-10-21 10:00:00
\.


--
-- Data for Name: fonduri; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fonduri (id, asociatie_id, tip, sold, contributie_lunara) FROM stdin;
1	1	RULMENT	4800.00	0.00
2	1	REPARATII	12350.00	400.00
\.


--
-- Data for Name: furnizori; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.furnizori (id, asociatie_id, denumire, cui, iban) FROM stdin;
1	1	ApaServ Test SA	RO10000001	RO49TEST1000000000000001
2	1	Salubris Test SRL	RO10000002	\N
3	1	LiftService Test SRL	RO10000003	\N
4	1	Energie Test SA	RO10000004	\N
\.


--
-- Data for Name: luni_intretinere; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.luni_intretinere (id, asociatie_id, an, luna, status, data_limita_citiri, data_publicare, data_scadenta, aprobat_de_id) FROM stdin;
1	1	2026	9	INCHISA	2026-09-20	2026-09-25 10:00:00	2026-10-15	2
2	1	2026	10	PUBLICATA	2026-10-20	2026-10-22 10:00:00	2026-11-15	2
3	2	2026	10	DESCHISA	2026-10-25	\N	\N	\N
\.


--
-- Data for Name: notificari; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notificari (id, utilizator_id, tip, mesaj, citita, data_creare) FROM stdin;
1	1	ABONAMENT	Plata simulată pentru planul Pro a fost confirmată. Ai primit 400 de tokeni.	t	2026-10-06 10:00:00
2	1	TOKENI	Pachetul de 100 de tokeni a fost adăugat în portofel.	t	2026-10-10 10:00:00
3	25	ABONAMENT	Abonamentul Max este suspendat până la plata lunii următoare (149 lei).	f	2026-10-20 10:00:00
4	18	TOKENI	Ai primit 50 de tokeni pentru perioada nouă a planului Free.	f	2026-10-01 10:00:00
5	2	INTRETINERE	Lista de plată pe octombrie 2026 a fost publicată.	f	2026-10-22 10:00:00
6	3	INTRETINERE	Lista de plată pe octombrie 2026 a fost publicată.	f	2026-10-22 10:00:00
7	4	INTRETINERE	Lista de plată pe octombrie 2026 a fost publicată.	f	2026-10-22 10:00:00
8	5	INTRETINERE	Lista de plată pe octombrie 2026 a fost publicată.	f	2026-10-22 10:00:00
9	6	INTRETINERE	Lista de plată pe octombrie 2026 a fost publicată.	f	2026-10-22 10:00:00
\.


--
-- Data for Name: pachete_tokeni; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pachete_tokeni (id, denumire, tokeni, pret, activ) FROM stdin;
1	Pachet 100 tokeni	100	19.00	t
2	Pachet 300 tokeni	300	49.00	t
3	Pachet 1000 tokeni	1000	129.00	t
\.


--
-- Data for Name: penalizari; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.penalizari (id, fisa_id, data_calcul, zile_intarziere, suma) FROM stdin;
\.


--
-- Data for Name: planuri; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.planuri (id, cod, denumire, pret_lunar, tokeni_lunari, max_apartamente, max_blocuri, raport_anual, activ) FROM stdin;
1	FREE	Free	0.00	50	30	1	f	t
2	PRO	Pro	49.00	400	300	5	t	t
3	MAX	Max	149.00	2000	\N	\N	t	t
\.


--
-- Data for Name: plati; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plati (id, apartament_id, platitor_id, inregistrat_de_id, suma, data_plata, metoda, numar_chitanta, status) FROM stdin;
1	1	2	1	100.53	2026-10-01 10:00:00	CASIERIE	BM-2026-0001	INREGISTRATA
2	2	3	\N	101.51	2026-10-02 10:00:00	TRANSFER	BM-2026-0002	INREGISTRATA
3	3	4	\N	166.49	2026-10-03 10:00:00	CARD	BM-2026-0003	INREGISTRATA
4	4	5	1	52.86	2026-10-04 10:00:00	CASIERIE	BM-2026-0004	INREGISTRATA
5	5	6	\N	145.58	2026-10-05 10:00:00	TRANSFER	BM-2026-0005	INREGISTRATA
6	6	7	\N	83.48	2026-10-06 10:00:00	CARD	BM-2026-0006	INREGISTRATA
7	7	8	1	148.46	2026-10-07 10:00:00	CASIERIE	BM-2026-0007	INREGISTRATA
8	8	9	\N	87.69	2026-10-08 10:00:00	TRANSFER	BM-2026-0008	INREGISTRATA
9	10	11	1	128.55	2026-10-10 10:00:00	CASIERIE	BM-2026-0009	INREGISTRATA
10	11	12	\N	130.43	2026-10-11 10:00:00	TRANSFER	BM-2026-0010	INREGISTRATA
11	12	13	\N	132.76	2026-10-12 10:00:00	CARD	BM-2026-0011	INREGISTRATA
12	14	15	\N	110.52	2026-10-02 10:00:00	TRANSFER	BM-2026-0012	INREGISTRATA
13	15	16	\N	112.40	2026-10-03 10:00:00	CARD	BM-2026-0013	INREGISTRATA
14	16	17	1	114.74	2026-10-04 10:00:00	CASIERIE	BM-2026-0014	INREGISTRATA
15	2	3	\N	109.86	2026-10-23 10:00:00	CARD	BM-2026-0015	INREGISTRATA
\.


--
-- Data for Name: portofele_tokeni; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.portofele_tokeni (id, asociatie_id, tokeni_plan, tokeni_extra, ultima_resetare, updated_at) FROM stdin;
1	1	368	100	2026-10-06 10:00:00	2026-10-23 16:05:16.143
2	2	50	0	2026-10-01 10:00:00	2026-10-23 16:05:16.157
3	3	0	0	2026-09-20 10:00:00	2026-10-23 16:05:16.174
\.


--
-- Data for Name: proprietati; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proprietati (id, apartament_id, utilizator_id, procent_detinere, data_inceput, data_sfarsit) FROM stdin;
1	1	2	100.00	2020-01-01	\N
2	2	3	100.00	2020-01-01	\N
3	3	4	100.00	2020-01-01	\N
4	4	5	100.00	2020-01-01	\N
5	5	6	100.00	2020-01-01	\N
6	6	7	100.00	2020-01-01	\N
7	7	8	100.00	2020-01-01	\N
8	8	9	100.00	2020-01-01	\N
9	9	10	100.00	2020-01-01	\N
10	10	11	100.00	2020-01-01	\N
11	11	12	100.00	2020-01-01	\N
12	12	13	100.00	2020-01-01	\N
13	13	14	100.00	2020-01-01	\N
14	14	15	100.00	2020-01-01	\N
15	15	16	100.00	2020-01-01	\N
16	16	17	100.00	2020-01-01	\N
17	17	19	100.00	2020-01-01	\N
18	18	20	100.00	2020-01-01	\N
19	19	21	100.00	2020-01-01	\N
20	20	22	100.00	2020-01-01	\N
21	21	23	100.00	2020-01-01	\N
22	22	24	100.00	2020-01-01	\N
23	23	26	100.00	2020-01-01	\N
24	24	27	100.00	2020-01-01	\N
25	25	28	100.00	2020-01-01	\N
26	26	29	100.00	2020-01-01	\N
\.


--
-- Data for Name: scari; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scari (id, bloc_id, denumire) FROM stdin;
1	1	A
2	1	B
3	2	1
4	3	A
5	3	B
6	4	A
\.


--
-- Data for Name: sesizari; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sesizari (id, apartament_id, autor_id, titlu, descriere, status, raspuns, data_creare, data_rezolvare) FROM stdin;
1	7	8	Bec ars pe casa scării	Becul de la etajul 1, scara A, nu mai funcționează.	REZOLVATA	Becul a fost înlocuit.	2026-10-02 10:00:00	2026-10-04 10:00:00
2	11	12	Infiltrație la ultimul etaj	Apare umezeală pe tavan după ploaie, în apartamentul 3 de la scara B.	IN_LUCRU	Am contactat o firmă pentru verificarea acoperișului.	2026-10-12 10:00:00	\N
3	14	15	Interfon defect	Interfonul nu sună în apartament.	NOUA	\N	2026-10-21 10:00:00	\N
\.


--
-- Data for Name: tranzactii_tokeni; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tranzactii_tokeni (id, portofel_id, tip, cantitate, sold_dupa, actiune_id, comanda_id, utilizator_id, descriere, created_at) FROM stdin;
1	1	ALOCARE	400	400	\N	1	\N	Alocare tokeni pentru perioada nouă	2026-08-05 10:00:00
2	1	CONSUM	-10	390	1	\N	1	Calcul întreținere august 2026	2026-08-24 10:00:00
3	1	CONSUM	-5	385	3	\N	1	Notificări listă de plată august	2026-08-24 10:00:00
4	1	EXPIRARE	-385	0	\N	\N	\N	Tokenii nefolosiți din plan au expirat	2026-09-05 10:00:00
5	1	ALOCARE	400	400	\N	2	\N	Alocare tokeni pentru perioada nouă	2026-09-05 10:00:00
6	1	CONSUM	-10	390	1	\N	1	Calcul întreținere septembrie 2026	2026-09-23 10:00:00
7	1	CONSUM	-5	385	2	\N	1	Recalculare după corectarea unui index	2026-09-23 10:00:00
8	1	CONSUM	-5	380	3	\N	1	Notificări listă de plată septembrie	2026-09-24 10:00:00
9	1	CONSUM	-2	378	4	\N	1	Export PDF listă de plată septembrie	2026-09-24 10:00:00
10	1	EXPIRARE	-378	0	\N	\N	\N	Tokenii nefolosiți din plan au expirat	2026-10-05 10:00:00
11	1	ALOCARE	400	400	\N	3	\N	Alocare tokeni pentru perioada nouă	2026-10-06 10:00:00
12	1	CUMPARARE	100	500	\N	4	1	Pachet de tokeni cumpărat	2026-10-10 10:00:00
13	1	CONSUM	-10	490	1	\N	1	Calcul întreținere octombrie 2026	2026-10-21 10:00:00
14	1	CONSUM	-5	485	3	\N	1	Notificări listă de plată octombrie	2026-10-21 10:00:00
15	1	CONSUM	-2	483	4	\N	1	Export PDF listă de plată octombrie	2026-10-22 10:00:00
16	1	CONSUM	-15	468	5	\N	1	Raport anual de încasări 2025-2026	2026-10-22 10:00:00
17	2	ALOCARE	50	50	\N	\N	\N	Alocare tokeni pentru perioada nouă	2026-09-01 10:00:00
18	2	CONSUM	-10	40	1	\N	18	Calcul întreținere septembrie 2026	2026-09-22 10:00:00
19	2	EXPIRARE	-40	0	\N	\N	\N	Tokenii nefolosiți din plan au expirat	2026-10-01 10:00:00
20	2	ALOCARE	50	50	\N	\N	\N	Alocare tokeni pentru perioada nouă	2026-10-01 10:00:00
21	3	ALOCARE	2000	2000	\N	5	\N	Alocare tokeni pentru perioada nouă	2026-09-20 10:00:00
22	3	CONSUM	-10	1990	1	\N	25	Calcul întreținere septembrie 2026	2026-10-02 10:00:00
23	3	CONSUM	-2	1988	4	\N	25	Export PDF listă de plată septembrie	2026-10-02 10:00:00
24	3	EXPIRARE	-1988	0	\N	\N	\N	Tokenii nefolosiți din plan au expirat	2026-10-20 10:00:00
\.


--
-- Data for Name: utilizatori; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utilizatori (id, asociatie_id, email, parola_hash, nume, prenume, telefon, rol, activ, created_at, updated_at) FROM stdin;
1	1	admin@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Popescu	Andrei	0700000001	ADMIN	t	2026-10-23 16:05:15.792	2026-10-23 16:05:15.792
2	1	presedinte@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Gheorghe	Maria	0700000002	PRESEDINTE	t	2026-10-23 16:05:15.799	2026-10-23 16:05:15.799
3	1	ioan.barbu1@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Barbu	Ioan	0710007919	PROPRIETAR	t	2026-10-23 16:05:15.878	2026-10-23 16:05:15.878
4	1	elena.ilie2@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Ilie	Elena	0710015838	PROPRIETAR	t	2026-10-23 16:05:15.882	2026-10-23 16:05:15.882
5	1	mihai.popa3@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Popa	Mihai	0710023757	PROPRIETAR	t	2026-10-23 16:05:15.885	2026-10-23 16:05:15.885
6	1	ana.ciobanu4@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Ciobanu	Ana	0710031676	PROPRIETAR	t	2026-10-23 16:05:15.888	2026-10-23 16:05:15.888
7	1	cristian.toma5@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Toma	Cristian	0710039595	PROPRIETAR	t	2026-10-23 16:05:15.891	2026-10-23 16:05:15.891
8	1	ioana.sandu6@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Sandu	Ioana	0710047514	PROPRIETAR	t	2026-10-23 16:05:15.893	2026-10-23 16:05:15.893
9	1	gabriel.stan7@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Stan	Gabriel	0710055433	PROPRIETAR	t	2026-10-23 16:05:15.895	2026-10-23 16:05:15.895
10	1	alexandra.munteanu8@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Munteanu	Alexandra	0710063352	PROPRIETAR	t	2026-10-23 16:05:15.898	2026-10-23 16:05:15.898
11	1	radu.florea9@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Florea	Radu	0710071271	PROPRIETAR	t	2026-10-23 16:05:15.9	2026-10-23 16:05:15.9
12	1	diana.voicu10@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Voicu	Diana	0710079190	PROPRIETAR	t	2026-10-23 16:05:15.903	2026-10-23 16:05:15.903
13	1	vlad.stoica11@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Stoica	Vlad	0710087109	PROPRIETAR	t	2026-10-23 16:05:15.905	2026-10-23 16:05:15.905
14	1	irina.moldovan12@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Moldovan	Irina	0710095028	PROPRIETAR	t	2026-10-23 16:05:15.907	2026-10-23 16:05:15.907
15	1	sorin.nistor13@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Nistor	Sorin	0710102947	PROPRIETAR	t	2026-10-23 16:05:15.909	2026-10-23 16:05:15.909
16	1	roxana.ionescu14@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Ionescu	Roxana	0710110866	PROPRIETAR	t	2026-10-23 16:05:15.911	2026-10-23 16:05:15.911
17	1	bogdan.matei15@florilor12.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Matei	Bogdan	0710118785	PROPRIETAR	t	2026-10-23 16:05:15.914	2026-10-23 16:05:15.914
18	2	admin@parculverde.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Neagu	Simona	0700000001	ADMIN	t	2026-10-23 16:05:15.918	2026-10-23 16:05:15.918
19	2	presedinte@parculverde.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Oprea	Florin	0700000002	PRESEDINTE	t	2026-10-23 16:05:15.92	2026-10-23 16:05:15.92
20	2	laura.constantin1@parculverde.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Constantin	Laura	0710007919	PROPRIETAR	t	2026-10-23 16:05:15.943	2026-10-23 16:05:15.943
21	2	adrian.rusu2@parculverde.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Rusu	Adrian	0710015838	PROPRIETAR	t	2026-10-23 16:05:15.946	2026-10-23 16:05:15.946
22	2	carmen.marin3@parculverde.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Marin	Carmen	0710023757	PROPRIETAR	t	2026-10-23 16:05:15.949	2026-10-23 16:05:15.949
23	2	paul.tudor4@parculverde.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Tudor	Paul	0710031676	PROPRIETAR	t	2026-10-23 16:05:15.952	2026-10-23 16:05:15.952
24	2	oana.dumitru5@parculverde.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Dumitru	Oana	0710039595	PROPRIETAR	t	2026-10-23 16:05:15.954	2026-10-23 16:05:15.954
25	3	admin@marasti7.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Lungu	Dan	0700000001	ADMIN	t	2026-10-23 16:05:15.958	2026-10-23 16:05:15.958
26	3	presedinte@marasti7.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Dinu	Raluca	0700000002	PRESEDINTE	t	2026-10-23 16:05:15.959	2026-10-23 16:05:15.959
27	3	andrei.popescu1@marasti7.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Popescu	Andrei	0710007919	PROPRIETAR	t	2026-10-23 16:05:16.048	2026-10-23 16:05:16.048
28	3	maria.gheorghe2@marasti7.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Gheorghe	Maria	0710015838	PROPRIETAR	t	2026-10-23 16:05:16.051	2026-10-23 16:05:16.051
29	3	ioan.barbu3@marasti7.test	scrypt$e4eb2f36cf7a511e5ade7851485f0c3e$21842d9c4d9262654bbdc14a062627c4ad504a761a685a970e61933b21b0e78ada6b260e4729b8464c7e23ed04ab11bd22fbc3cb774b405716d2330332eaa472	Barbu	Ioan	0710023757	PROPRIETAR	t	2026-10-23 16:05:16.054	2026-10-23 16:05:16.054
\.


--
-- Name: abonamente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.abonamente_id_seq', 4, true);


--
-- Name: actiuni_taxabile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.actiuni_taxabile_id_seq', 5, true);


--
-- Name: alocari_plati_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alocari_plati_id_seq', 15, true);


--
-- Name: anunturi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.anunturi_id_seq', 3, true);


--
-- Name: apartamente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.apartamente_id_seq', 44, true);


--
-- Name: asociatii_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asociatii_id_seq', 3, true);


--
-- Name: blocuri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.blocuri_id_seq', 4, true);


--
-- Name: categorii_cheltuieli_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categorii_cheltuieli_id_seq', 4, true);


--
-- Name: citiri_contoare_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.citiri_contoare_id_seq', 36, true);


--
-- Name: comenzi_simulate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comenzi_simulate_id_seq', 6, true);


--
-- Name: contoare_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contoare_id_seq', 44, true);


--
-- Name: detalii_intretinere_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detalii_intretinere_id_seq', 128, true);


--
-- Name: facturi_furnizori_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.facturi_furnizori_id_seq', 8, true);


--
-- Name: fise_intretinere_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fise_intretinere_id_seq', 32, true);


--
-- Name: fonduri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fonduri_id_seq', 2, true);


--
-- Name: furnizori_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.furnizori_id_seq', 4, true);


--
-- Name: luni_intretinere_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.luni_intretinere_id_seq', 3, true);


--
-- Name: notificari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notificari_id_seq', 9, true);


--
-- Name: pachete_tokeni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pachete_tokeni_id_seq', 3, true);


--
-- Name: penalizari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.penalizari_id_seq', 1, false);


--
-- Name: planuri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.planuri_id_seq', 3, true);


--
-- Name: plati_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.plati_id_seq', 15, true);


--
-- Name: portofele_tokeni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.portofele_tokeni_id_seq', 3, true);


--
-- Name: proprietati_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.proprietati_id_seq', 26, true);


--
-- Name: scari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.scari_id_seq', 6, true);


--
-- Name: sesizari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sesizari_id_seq', 3, true);


--
-- Name: tranzactii_tokeni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tranzactii_tokeni_id_seq', 24, true);


--
-- Name: utilizatori_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.utilizatori_id_seq', 29, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: abonamente abonamente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonamente
    ADD CONSTRAINT abonamente_pkey PRIMARY KEY (id);


--
-- Name: actiuni_taxabile actiuni_taxabile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actiuni_taxabile
    ADD CONSTRAINT actiuni_taxabile_pkey PRIMARY KEY (id);


--
-- Name: alocari_plati alocari_plati_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alocari_plati
    ADD CONSTRAINT alocari_plati_pkey PRIMARY KEY (id);


--
-- Name: anunturi anunturi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anunturi
    ADD CONSTRAINT anunturi_pkey PRIMARY KEY (id);


--
-- Name: apartamente apartamente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apartamente
    ADD CONSTRAINT apartamente_pkey PRIMARY KEY (id);


--
-- Name: asociatii asociatii_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asociatii
    ADD CONSTRAINT asociatii_pkey PRIMARY KEY (id);


--
-- Name: blocuri blocuri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocuri
    ADD CONSTRAINT blocuri_pkey PRIMARY KEY (id);


--
-- Name: categorii_cheltuieli categorii_cheltuieli_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorii_cheltuieli
    ADD CONSTRAINT categorii_cheltuieli_pkey PRIMARY KEY (id);


--
-- Name: citiri_contoare citiri_contoare_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citiri_contoare
    ADD CONSTRAINT citiri_contoare_pkey PRIMARY KEY (id);


--
-- Name: comenzi_simulate comenzi_simulate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_pkey PRIMARY KEY (id);


--
-- Name: contoare contoare_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contoare
    ADD CONSTRAINT contoare_pkey PRIMARY KEY (id);


--
-- Name: detalii_intretinere detalii_intretinere_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalii_intretinere
    ADD CONSTRAINT detalii_intretinere_pkey PRIMARY KEY (id);


--
-- Name: facturi_furnizori facturi_furnizori_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturi_furnizori
    ADD CONSTRAINT facturi_furnizori_pkey PRIMARY KEY (id);


--
-- Name: fise_intretinere fise_intretinere_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fise_intretinere
    ADD CONSTRAINT fise_intretinere_pkey PRIMARY KEY (id);


--
-- Name: fonduri fonduri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fonduri
    ADD CONSTRAINT fonduri_pkey PRIMARY KEY (id);


--
-- Name: furnizori furnizori_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.furnizori
    ADD CONSTRAINT furnizori_pkey PRIMARY KEY (id);


--
-- Name: luni_intretinere luni_intretinere_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.luni_intretinere
    ADD CONSTRAINT luni_intretinere_pkey PRIMARY KEY (id);


--
-- Name: notificari notificari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificari
    ADD CONSTRAINT notificari_pkey PRIMARY KEY (id);


--
-- Name: pachete_tokeni pachete_tokeni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pachete_tokeni
    ADD CONSTRAINT pachete_tokeni_pkey PRIMARY KEY (id);


--
-- Name: penalizari penalizari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalizari
    ADD CONSTRAINT penalizari_pkey PRIMARY KEY (id);


--
-- Name: planuri planuri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planuri
    ADD CONSTRAINT planuri_pkey PRIMARY KEY (id);


--
-- Name: plati plati_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plati
    ADD CONSTRAINT plati_pkey PRIMARY KEY (id);


--
-- Name: portofele_tokeni portofele_tokeni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portofele_tokeni
    ADD CONSTRAINT portofele_tokeni_pkey PRIMARY KEY (id);


--
-- Name: proprietati proprietati_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proprietati
    ADD CONSTRAINT proprietati_pkey PRIMARY KEY (id);


--
-- Name: scari scari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scari
    ADD CONSTRAINT scari_pkey PRIMARY KEY (id);


--
-- Name: sesizari sesizari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesizari
    ADD CONSTRAINT sesizari_pkey PRIMARY KEY (id);


--
-- Name: tranzactii_tokeni tranzactii_tokeni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tranzactii_tokeni
    ADD CONSTRAINT tranzactii_tokeni_pkey PRIMARY KEY (id);


--
-- Name: utilizatori utilizatori_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilizatori
    ADD CONSTRAINT utilizatori_pkey PRIMARY KEY (id);


--
-- Name: abonamente_asociatie_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX abonamente_asociatie_id_status_idx ON public.abonamente USING btree (asociatie_id, status);


--
-- Name: abonamente_status_sfarsit_perioada_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX abonamente_status_sfarsit_perioada_idx ON public.abonamente USING btree (status, sfarsit_perioada);


--
-- Name: actiuni_taxabile_cod_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX actiuni_taxabile_cod_key ON public.actiuni_taxabile USING btree (cod);


--
-- Name: alocari_plati_plata_id_fisa_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX alocari_plati_plata_id_fisa_id_key ON public.alocari_plati USING btree (plata_id, fisa_id);


--
-- Name: apartamente_scara_id_numar_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX apartamente_scara_id_numar_key ON public.apartamente USING btree (scara_id, numar);


--
-- Name: asociatii_cui_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX asociatii_cui_key ON public.asociatii USING btree (cui);


--
-- Name: blocuri_asociatie_id_denumire_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX blocuri_asociatie_id_denumire_key ON public.blocuri USING btree (asociatie_id, denumire);


--
-- Name: categorii_cheltuieli_asociatie_id_denumire_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categorii_cheltuieli_asociatie_id_denumire_key ON public.categorii_cheltuieli USING btree (asociatie_id, denumire);


--
-- Name: citiri_contoare_contor_id_luna_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX citiri_contoare_contor_id_luna_id_key ON public.citiri_contoare USING btree (contor_id, luna_id);


--
-- Name: comenzi_simulate_asociatie_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comenzi_simulate_asociatie_id_created_at_idx ON public.comenzi_simulate USING btree (asociatie_id, created_at);


--
-- Name: comenzi_simulate_referinta_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX comenzi_simulate_referinta_key ON public.comenzi_simulate USING btree (referinta);


--
-- Name: comenzi_simulate_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comenzi_simulate_status_idx ON public.comenzi_simulate USING btree (status);


--
-- Name: contoare_apartament_id_serie_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contoare_apartament_id_serie_key ON public.contoare USING btree (apartament_id, serie);


--
-- Name: detalii_intretinere_fisa_id_categorie_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX detalii_intretinere_fisa_id_categorie_id_key ON public.detalii_intretinere USING btree (fisa_id, categorie_id);


--
-- Name: facturi_furnizori_furnizor_id_numar_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX facturi_furnizori_furnizor_id_numar_key ON public.facturi_furnizori USING btree (furnizor_id, numar);


--
-- Name: facturi_furnizori_luna_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX facturi_furnizori_luna_id_idx ON public.facturi_furnizori USING btree (luna_id);


--
-- Name: fise_intretinere_apartament_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fise_intretinere_apartament_id_status_idx ON public.fise_intretinere USING btree (apartament_id, status);


--
-- Name: fise_intretinere_luna_id_apartament_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX fise_intretinere_luna_id_apartament_id_key ON public.fise_intretinere USING btree (luna_id, apartament_id);


--
-- Name: fonduri_asociatie_id_tip_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX fonduri_asociatie_id_tip_key ON public.fonduri USING btree (asociatie_id, tip);


--
-- Name: furnizori_asociatie_id_cui_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX furnizori_asociatie_id_cui_key ON public.furnizori USING btree (asociatie_id, cui);


--
-- Name: luni_intretinere_asociatie_id_an_luna_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX luni_intretinere_asociatie_id_an_luna_key ON public.luni_intretinere USING btree (asociatie_id, an, luna);


--
-- Name: notificari_utilizator_id_citita_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notificari_utilizator_id_citita_idx ON public.notificari USING btree (utilizator_id, citita);


--
-- Name: penalizari_fisa_id_data_calcul_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX penalizari_fisa_id_data_calcul_key ON public.penalizari USING btree (fisa_id, data_calcul);


--
-- Name: planuri_cod_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX planuri_cod_key ON public.planuri USING btree (cod);


--
-- Name: plati_apartament_id_data_plata_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plati_apartament_id_data_plata_idx ON public.plati USING btree (apartament_id, data_plata);


--
-- Name: plati_numar_chitanta_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX plati_numar_chitanta_key ON public.plati USING btree (numar_chitanta);


--
-- Name: portofele_tokeni_asociatie_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX portofele_tokeni_asociatie_id_key ON public.portofele_tokeni USING btree (asociatie_id);


--
-- Name: proprietati_utilizator_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proprietati_utilizator_id_idx ON public.proprietati USING btree (utilizator_id);


--
-- Name: scari_bloc_id_denumire_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX scari_bloc_id_denumire_key ON public.scari USING btree (bloc_id, denumire);


--
-- Name: sesizari_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sesizari_status_idx ON public.sesizari USING btree (status);


--
-- Name: tranzactii_tokeni_portofel_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tranzactii_tokeni_portofel_id_created_at_idx ON public.tranzactii_tokeni USING btree (portofel_id, created_at);


--
-- Name: utilizatori_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX utilizatori_email_key ON public.utilizatori USING btree (email);


--
-- Name: abonamente abonamente_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonamente
    ADD CONSTRAINT abonamente_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: abonamente abonamente_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonamente
    ADD CONSTRAINT abonamente_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.planuri(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: abonamente abonamente_plan_urmator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonamente
    ADD CONSTRAINT abonamente_plan_urmator_id_fkey FOREIGN KEY (plan_urmator_id) REFERENCES public.planuri(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: alocari_plati alocari_plati_fisa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alocari_plati
    ADD CONSTRAINT alocari_plati_fisa_id_fkey FOREIGN KEY (fisa_id) REFERENCES public.fise_intretinere(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: alocari_plati alocari_plati_plata_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alocari_plati
    ADD CONSTRAINT alocari_plati_plata_id_fkey FOREIGN KEY (plata_id) REFERENCES public.plati(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: anunturi anunturi_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anunturi
    ADD CONSTRAINT anunturi_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: anunturi anunturi_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anunturi
    ADD CONSTRAINT anunturi_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: apartamente apartamente_scara_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apartamente
    ADD CONSTRAINT apartamente_scara_id_fkey FOREIGN KEY (scara_id) REFERENCES public.scari(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blocuri blocuri_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocuri
    ADD CONSTRAINT blocuri_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categorii_cheltuieli categorii_cheltuieli_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorii_cheltuieli
    ADD CONSTRAINT categorii_cheltuieli_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: citiri_contoare citiri_contoare_contor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citiri_contoare
    ADD CONSTRAINT citiri_contoare_contor_id_fkey FOREIGN KEY (contor_id) REFERENCES public.contoare(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: citiri_contoare citiri_contoare_introdus_de_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citiri_contoare
    ADD CONSTRAINT citiri_contoare_introdus_de_id_fkey FOREIGN KEY (introdus_de_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: citiri_contoare citiri_contoare_luna_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citiri_contoare
    ADD CONSTRAINT citiri_contoare_luna_id_fkey FOREIGN KEY (luna_id) REFERENCES public.luni_intretinere(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comenzi_simulate comenzi_simulate_abonament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_abonament_id_fkey FOREIGN KEY (abonament_id) REFERENCES public.abonamente(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comenzi_simulate comenzi_simulate_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comenzi_simulate comenzi_simulate_pachet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_pachet_id_fkey FOREIGN KEY (pachet_id) REFERENCES public.pachete_tokeni(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comenzi_simulate comenzi_simulate_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.planuri(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comenzi_simulate comenzi_simulate_utilizator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comenzi_simulate
    ADD CONSTRAINT comenzi_simulate_utilizator_id_fkey FOREIGN KEY (utilizator_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contoare contoare_apartament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contoare
    ADD CONSTRAINT contoare_apartament_id_fkey FOREIGN KEY (apartament_id) REFERENCES public.apartamente(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: detalii_intretinere detalii_intretinere_categorie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalii_intretinere
    ADD CONSTRAINT detalii_intretinere_categorie_id_fkey FOREIGN KEY (categorie_id) REFERENCES public.categorii_cheltuieli(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalii_intretinere detalii_intretinere_fisa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalii_intretinere
    ADD CONSTRAINT detalii_intretinere_fisa_id_fkey FOREIGN KEY (fisa_id) REFERENCES public.fise_intretinere(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: facturi_furnizori facturi_furnizori_categorie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturi_furnizori
    ADD CONSTRAINT facturi_furnizori_categorie_id_fkey FOREIGN KEY (categorie_id) REFERENCES public.categorii_cheltuieli(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: facturi_furnizori facturi_furnizori_furnizor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturi_furnizori
    ADD CONSTRAINT facturi_furnizori_furnizor_id_fkey FOREIGN KEY (furnizor_id) REFERENCES public.furnizori(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: facturi_furnizori facturi_furnizori_luna_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturi_furnizori
    ADD CONSTRAINT facturi_furnizori_luna_id_fkey FOREIGN KEY (luna_id) REFERENCES public.luni_intretinere(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fise_intretinere fise_intretinere_apartament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fise_intretinere
    ADD CONSTRAINT fise_intretinere_apartament_id_fkey FOREIGN KEY (apartament_id) REFERENCES public.apartamente(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fise_intretinere fise_intretinere_luna_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fise_intretinere
    ADD CONSTRAINT fise_intretinere_luna_id_fkey FOREIGN KEY (luna_id) REFERENCES public.luni_intretinere(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fonduri fonduri_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fonduri
    ADD CONSTRAINT fonduri_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: furnizori furnizori_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.furnizori
    ADD CONSTRAINT furnizori_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: luni_intretinere luni_intretinere_aprobat_de_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.luni_intretinere
    ADD CONSTRAINT luni_intretinere_aprobat_de_id_fkey FOREIGN KEY (aprobat_de_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: luni_intretinere luni_intretinere_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.luni_intretinere
    ADD CONSTRAINT luni_intretinere_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notificari notificari_utilizator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificari
    ADD CONSTRAINT notificari_utilizator_id_fkey FOREIGN KEY (utilizator_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: penalizari penalizari_fisa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalizari
    ADD CONSTRAINT penalizari_fisa_id_fkey FOREIGN KEY (fisa_id) REFERENCES public.fise_intretinere(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plati plati_apartament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plati
    ADD CONSTRAINT plati_apartament_id_fkey FOREIGN KEY (apartament_id) REFERENCES public.apartamente(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: plati plati_inregistrat_de_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plati
    ADD CONSTRAINT plati_inregistrat_de_id_fkey FOREIGN KEY (inregistrat_de_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: plati plati_platitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plati
    ADD CONSTRAINT plati_platitor_id_fkey FOREIGN KEY (platitor_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: portofele_tokeni portofele_tokeni_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portofele_tokeni
    ADD CONSTRAINT portofele_tokeni_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proprietati proprietati_apartament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proprietati
    ADD CONSTRAINT proprietati_apartament_id_fkey FOREIGN KEY (apartament_id) REFERENCES public.apartamente(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proprietati proprietati_utilizator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proprietati
    ADD CONSTRAINT proprietati_utilizator_id_fkey FOREIGN KEY (utilizator_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: scari scari_bloc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scari
    ADD CONSTRAINT scari_bloc_id_fkey FOREIGN KEY (bloc_id) REFERENCES public.blocuri(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sesizari sesizari_apartament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesizari
    ADD CONSTRAINT sesizari_apartament_id_fkey FOREIGN KEY (apartament_id) REFERENCES public.apartamente(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sesizari sesizari_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesizari
    ADD CONSTRAINT sesizari_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tranzactii_tokeni tranzactii_tokeni_actiune_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tranzactii_tokeni
    ADD CONSTRAINT tranzactii_tokeni_actiune_id_fkey FOREIGN KEY (actiune_id) REFERENCES public.actiuni_taxabile(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tranzactii_tokeni tranzactii_tokeni_comanda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tranzactii_tokeni
    ADD CONSTRAINT tranzactii_tokeni_comanda_id_fkey FOREIGN KEY (comanda_id) REFERENCES public.comenzi_simulate(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tranzactii_tokeni tranzactii_tokeni_portofel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tranzactii_tokeni
    ADD CONSTRAINT tranzactii_tokeni_portofel_id_fkey FOREIGN KEY (portofel_id) REFERENCES public.portofele_tokeni(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tranzactii_tokeni tranzactii_tokeni_utilizator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tranzactii_tokeni
    ADD CONSTRAINT tranzactii_tokeni_utilizator_id_fkey FOREIGN KEY (utilizator_id) REFERENCES public.utilizatori(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: utilizatori utilizatori_asociatie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilizatori
    ADD CONSTRAINT utilizatori_asociatie_id_fkey FOREIGN KEY (asociatie_id) REFERENCES public.asociatii(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict jdDSaAUEWcI5t916gsWk806PItR2adziJIvS1P8OP0nqaFrUISGAYFfP5d5yPcR

