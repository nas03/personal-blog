create table public.categories (
    category_id integer primary key not null,
    title character varying(255) not null default '',
    description text not null default ''::text,
    ts_updated timestamp with time zone default CURRENT_TIMESTAMP,
    ts_registered timestamp with time zone default CURRENT_TIMESTAMP
);
create table public.comments (
    comment_id integer primary key not null,
    post_id integer not null,
    user_id uuid not null,
    comment character varying(200) default '',
    ts_updated timestamp with time zone default CURRENT_TIMESTAMP,
    ts_registered timestamp with time zone default CURRENT_TIMESTAMP,
    foreign key (post_id) references public.posts (post_id) match simple on update no action on delete cascade,
    foreign key (user_id) references public.users_basic_data (user_id) match simple on update no action on delete cascade
);
create table public.post_category (
    id integer primary key not null,
    post_id integer not null,
    category_id integer not null,
    ts_updated timestamp with time zone default CURRENT_TIMESTAMP,
    ts_registered timestamp with time zone default CURRENT_TIMESTAMP,
    foreign key (category_id) references public.categories (category_id) match simple on update no action on delete cascade,
    foreign key (post_id) references public.posts (post_id) match simple on update no action on delete cascade
);
create table public.posts (
    post_id integer primary key not null,
    user_id uuid not null,
    thumbnail_url character varying(255) not null default '',
    title character varying(255) not null default '',
    content text not null default ''::text,
    ts_updated timestamp with time zone default CURRENT_TIMESTAMP,
    ts_registered timestamp with time zone default CURRENT_TIMESTAMP,
    foreign key (user_id) references public.users_basic_data (user_id) match simple on update no action on delete cascade
);
create table public.user_access_histories (
    id integer primary key not null,
    user_id uuid not null,
    user_agent character varying(255) not null,
    ip_address inet not null,
    ts_updated timestamp with time zone default CURRENT_TIMESTAMP,
    ts_registered timestamp with time zone default CURRENT_TIMESTAMP,
    foreign key (user_id) references public.users_basic_data (user_id) match simple on update no action on delete no action
);
create table public.user_refresh_tokens (
    id integer primary key not null,
    user_id uuid not null,
    refresh_token text not null,
    exp timestamp without time zone not null,
    ts_updated timestamp with time zone default CURRENT_TIMESTAMP,
    ts_registered timestamp with time zone default CURRENT_TIMESTAMP,
    iat timestamp without time zone,
    foreign key (user_id) references public.users_basic_data (user_id) match simple on update no action on delete no action
);
create table public.users_basic_data (
    user_id uuid primary key not null default gen_random_uuid(),
    first_name character varying(100) not null,
    last_name character varying(100) not null,
    email character varying(255) not null,
    phone_number character varying(20) default NULL,
    hashed_password character varying(255) not null,
    ts_updated timestamp with time zone default CURRENT_TIMESTAMP,
    ts_created timestamp with time zone default CURRENT_TIMESTAMP,
    authorization_id integer not null default 2
);
create unique index user_email_key on users_basic_data using btree (email);
create unique index user_phone_number_key on users_basic_data using btree (phone_number);
create table public.users_profile (
    id integer primary key not null,
    user_id uuid not null,
    profile_image_url text,
    country character varying(30) default NULL,
    address text,
    foreign key (user_id) references public.users_basic_data (user_id),
    ts_updated timestamp with time zone default CURRENT_TIMESTAMP,
    ts_created timestamp with time zone default CURRENT_TIMESTAMP,
    match simple on update no action on delete cascade
);